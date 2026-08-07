import type { Label, Prisma } from "@prisma/client";
import { prisma } from "./prismaClient.js";
import { clampLimit, cursorWhereDesc, buildPage } from "./pagination.js";
import type { SprintRepository } from "../services/sprintService.js";

const TICKET_LABELS_INCLUDE = { labels: { include: { label: true } } } satisfies Prisma.TicketInclude;

function toTicketRow<T extends { labels: { label: Label }[] }>(row: T) {
  return { ...row, labels: row.labels.map((ticketLabel) => ticketLabel.label) };
}

export const sprintRepository: SprintRepository = {
  async findSprintById(sprintId) {
    return prisma.sprint.findUnique({ where: { id: sprintId } });
  },

  async listSprintsForProject(projectId) {
    return prisma.sprint.findMany({ where: { projectId }, orderBy: { startDate: "desc" } });
  },

  async createSprint(projectId, input) {
    return prisma.sprint.create({
      data: {
        projectId,
        name: input.name,
        goal: input.goal ?? null,
        startDate: input.startDate,
        endDate: input.endDate,
      },
    });
  },

  async updateSprint(sprintId, patch) {
    return prisma.sprint.update({ where: { id: sprintId }, data: patch });
  },

  async deleteSprint(sprintId) {
    await prisma.sprint.delete({ where: { id: sprintId } });
  },

  async listSprintTickets(sprintId, cursor, limit) {
    const take = clampLimit(limit);
    const rows = await prisma.ticket.findMany({
      where: { sprintId, ...(cursorWhereDesc(cursor) ?? {}) },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: take + 1,
      include: TICKET_LABELS_INCLUDE,
    });
    return buildPage(rows.map(toTicketRow), take);
  },
};
