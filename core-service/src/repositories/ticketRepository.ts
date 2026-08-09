import type { Label, Prisma } from "@prisma/client";
import { prisma } from "./prismaClient.js";
import { clampLimit, cursorWhereDesc, buildPage } from "./pagination.js";
import type { TicketEventType } from "../services/types.js";
import type { TicketRepository } from "../services/ticketService.js";
import { ValidationError } from "../errors/index.js";

function toEventRow<T extends { data: unknown }>(row: T) {
  return { ...row, data: row.data as Record<string, unknown> };
}

const TICKET_LABELS_INCLUDE = { labels: { include: { label: true } } } satisfies Prisma.TicketInclude;

function toTicketRow<T extends { labels: { label: Label }[] }>(row: T) {
  return { ...row, labels: row.labels.map((ticketLabel) => ticketLabel.label) };
}

export const ticketRepository: TicketRepository = {
  async findTicketById(ticketId) {
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId }, include: TICKET_LABELS_INCLUDE });
    return ticket ? toTicketRow(ticket) : null;
  },

  async findTicketByNumber(projectId, number) {
    const ticket = await prisma.ticket.findUnique({
      where: { projectId_number: { projectId, number } },
      include: TICKET_LABELS_INCLUDE,
    });
    return ticket ? toTicketRow(ticket) : null;
  },

  async listTickets(projectId, filter) {
    const take = clampLimit(filter.limit);

    const conditions: Prisma.TicketWhereInput[] = [{ projectId, archivedAt: null }];
    if (filter.stateId) conditions.push({ stateId: filter.stateId });
    if (filter.assigneeId) conditions.push({ assigneeId: filter.assigneeId });
    if (filter.sprintId) conditions.push({ sprintId: filter.sprintId });
    if (filter.updatedSince) conditions.push({ updatedAt: { gt: filter.updatedSince } });
    if (filter.labelId) conditions.push({ labels: { some: { labelId: filter.labelId } } });
    if (filter.q) {
      conditions.push({
        OR: [
          { title: { contains: filter.q, mode: "insensitive" } },
          { description: { contains: filter.q, mode: "insensitive" } },
        ],
      });
    }
    const cursorClause = cursorWhereDesc(filter.cursor);
    if (cursorClause) conditions.push(cursorClause);

    const where: Prisma.TicketWhereInput = { AND: conditions };

    const rows = await prisma.ticket.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: take + 1,
      include: TICKET_LABELS_INCLUDE,
    });
    return buildPage(rows.map(toTicketRow), take);
  },

  async listTicketsAssignedToUser(userId, cursor, limit) {
    const take = clampLimit(limit);
    const rows = await prisma.ticket.findMany({
      where: { assigneeId: userId, archivedAt: null, ...(cursorWhereDesc(cursor) ?? {}) },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: take + 1,
      include: TICKET_LABELS_INCLUDE,
    });
    return buildPage(rows.map(toTicketRow), take);
  },

  async createTicket(input, defaultStateId) {
    return prisma.$transaction(async (tx) => {
      if (input.sprintId) {
        const sprint = await tx.sprint.findUnique({ where: { id: input.sprintId }, select: { projectId: true } });
        if (!sprint || sprint.projectId !== input.projectId) {
          throw new ValidationError("sprintId must belong to this ticket's project");
        }
      }
      const labelIds = input.labelIds ? [...new Set(input.labelIds)] : undefined;
      if (labelIds && labelIds.length > 0) {
        const matchingCount = await tx.label.count({
          where: { id: { in: labelIds }, projectId: input.projectId },
        });
        if (matchingCount !== labelIds.length) {
          throw new ValidationError("labelIds must all belong to this ticket's project");
        }
      }

      const project = await tx.project.update({
        where: { id: input.projectId },
        data: { nextTicketNo: { increment: 1 } },
      });
      const number = project.nextTicketNo - 1;

      const ticket = await tx.ticket.create({
        data: {
          projectId: input.projectId,
          number,
          title: input.title,
          description: input.description ?? null,
          priority: input.priority ?? "NONE",
          stateId: input.stateId ?? defaultStateId,
          assigneeId: input.assigneeId ?? null,
          reporterId: input.reporterId,
          sprintId: input.sprintId ?? null,
        },
      });

      if (labelIds && labelIds.length > 0) {
        await tx.ticketLabel.createMany({
          data: labelIds.map((labelId) => ({ ticketId: ticket.id, labelId })),
        });
      }

      await tx.ticketEvent.create({
        data: {
          ticketId: ticket.id,
          type: "CREATED",
          data: { title: ticket.title, priority: ticket.priority },
          actorUserId: input.reporterId,
        },
      });

      const created = await tx.ticket.findUniqueOrThrow({ where: { id: ticket.id }, include: TICKET_LABELS_INCLUDE });
      return toTicketRow(created);
    });
  },

  async updateTicketIfVersionMatches(ticketId, expectedVersion, patch, actorUserId) {
    return prisma.$transaction(async (tx) => {
      const current = await tx.ticket.findUnique({ where: { id: ticketId } });
      if (!current) return null;

      const data: Prisma.TicketUncheckedUpdateManyInput = { version: { increment: 1 } };
      const events: Array<{ type: TicketEventType; data: Record<string, unknown> }> = [];

      if (patch.title !== undefined && patch.title !== current.title) {
        data.title = patch.title;
        events.push({ type: "TITLE_CHANGED", data: { before: current.title, after: patch.title } });
      }
      if (patch.description !== undefined && patch.description !== current.description) {
        data.description = patch.description;
        events.push({ type: "DESCRIPTION_CHANGED", data: { before: current.description, after: patch.description } });
      }
      if (patch.priority !== undefined && patch.priority !== current.priority) {
        data.priority = patch.priority;
        events.push({ type: "PRIORITY_CHANGED", data: { before: current.priority, after: patch.priority } });
      }
      if (patch.assigneeId !== undefined && patch.assigneeId !== current.assigneeId) {
        data.assigneeId = patch.assigneeId;
        events.push(
          patch.assigneeId
            ? { type: "ASSIGNED", data: { assigneeId: patch.assigneeId } }
            : { type: "UNASSIGNED", data: { previousAssigneeId: current.assigneeId } },
        );
      }
      if (patch.sprintId !== undefined && patch.sprintId !== current.sprintId) {
        if (patch.sprintId !== null) {
          const sprint = await tx.sprint.findUnique({ where: { id: patch.sprintId }, select: { projectId: true } });
          if (!sprint || sprint.projectId !== current.projectId) {
            throw new ValidationError("sprintId must belong to this ticket's project");
          }
        }
        data.sprintId = patch.sprintId;
        events.push({ type: "SPRINT_CHANGED", data: { before: current.sprintId, after: patch.sprintId } });
      }

      if (patch.labelIds !== undefined && patch.labelIds.length > 0) {
        const matchingCount = await tx.label.count({
          where: { id: { in: patch.labelIds }, projectId: current.projectId },
        });
        if (matchingCount !== new Set(patch.labelIds).size) {
          throw new ValidationError("labelIds must all belong to this ticket's project");
        }
      }

      const updateResult = await tx.ticket.updateMany({
        where: { id: ticketId, version: expectedVersion },
        data,
      });
      if (updateResult.count === 0) return null;

      if (patch.labelIds !== undefined) {
        const existingLabels = await tx.ticketLabel.findMany({ where: { ticketId } });
        const existingIds = new Set(existingLabels.map((l) => l.labelId));
        const nextIds = new Set(patch.labelIds);
        const toAdd = patch.labelIds.filter((id) => !existingIds.has(id));
        const toRemove = [...existingIds].filter((id) => !nextIds.has(id));

        if (toAdd.length > 0) {
          await tx.ticketLabel.createMany({ data: toAdd.map((labelId) => ({ ticketId, labelId })) });
          events.push({ type: "LABEL_ADDED", data: { labelIds: toAdd } });
        }
        if (toRemove.length > 0) {
          await tx.ticketLabel.deleteMany({ where: { ticketId, labelId: { in: toRemove } } });
          events.push({ type: "LABEL_REMOVED", data: { labelIds: toRemove } });
        }
      }

      for (const event of events) {
        await tx.ticketEvent.create({
          data: { ticketId, type: event.type, data: event.data as Prisma.InputJsonValue, actorUserId },
        });
      }

      const updated = await tx.ticket.findUniqueOrThrow({ where: { id: ticketId }, include: TICKET_LABELS_INCLUDE });
      return toTicketRow(updated);
    });
  },

  async transitionTicketState(ticketId, fromStateId, toStateId, expectedVersion, actorUserId) {
    return prisma.$transaction(async (tx) => {
      const updateResult = await tx.ticket.updateMany({
        where: { id: ticketId, stateId: fromStateId, version: expectedVersion },
        data: { stateId: toStateId, version: { increment: 1 } },
      });
      if (updateResult.count === 0) return null;

      await tx.ticketEvent.create({
        data: { ticketId, type: "STATE_CHANGED", data: { fromStateId, toStateId }, actorUserId },
      });

      const updated = await tx.ticket.findUniqueOrThrow({ where: { id: ticketId }, include: TICKET_LABELS_INCLUDE });
      return toTicketRow(updated);
    });
  },

  async listTicketEvents(ticketId, cursor, limit) {
    const take = clampLimit(limit);
    const rows = await prisma.ticketEvent.findMany({
      where: { ticketId, ...(cursorWhereDesc(cursor) ?? {}) },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: take + 1,
    });
    return buildPage(rows.map(toEventRow), take);
  },
};
