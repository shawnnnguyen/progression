import { Prisma } from "@prisma/client";
import { prisma } from "./prismaClient.js";
import type { LabelRepository } from "../services/labelService.js";
import { ConflictError } from "../errors/index.js";

const FOREIGN_KEY_VIOLATION = "P2003";

export const labelRepository: LabelRepository = {
  async findLabelById(labelId) {
    return prisma.label.findUnique({ where: { id: labelId } });
  },

  async listLabelsForProject(projectId) {
    return prisma.label.findMany({ where: { projectId }, orderBy: { name: "asc" } });
  },

  async createLabel(projectId, name, color) {
    return prisma.label.create({ data: { projectId, name, color } });
  },

  async updateLabel(labelId, patch) {
    return prisma.label.update({ where: { id: labelId }, data: patch });
  },

  async deleteLabel(labelId) {
    try {
      await prisma.label.delete({ where: { id: labelId } });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === FOREIGN_KEY_VIOLATION) {
        throw new ConflictError("Label is still applied to at least one ticket");
      }
      throw err;
    }
  },

  async existsWithName(projectId, name) {
    const label = await prisma.label.findUnique({ where: { projectId_name: { projectId, name } } });
    return label !== null;
  },

  async isLabelInUse(labelId) {
    const count = await prisma.ticketLabel.count({ where: { labelId } });
    return count > 0;
  },
};
