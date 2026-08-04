import { prisma } from "./prismaClient.js";
import { clampLimit, cursorWhereDesc, buildPage } from "./pagination.js";
import type { SprintRepository } from "../services/sprintService.js";

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

  // Tickets in the sprint fall back to sprintId = null (SetNull, §3) via the
  // FK itself — no explicit unset step needed here.
  async deleteSprint(sprintId) {
    await prisma.sprint.delete({ where: { id: sprintId } });
  },

  async listSprintTickets(sprintId, cursor, limit) {
    const take = clampLimit(limit);
    const rows = await prisma.ticket.findMany({
      where: { sprintId, ...(cursorWhereDesc(cursor) ?? {}) },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: take + 1,
    });
    return buildPage(rows, take);
  },
};
