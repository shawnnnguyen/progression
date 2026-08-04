import { prisma } from "./prismaClient.js";
import type { AuthzDeps } from "../services/authz.js";

export const authzRepository: AuthzDeps = {
  async getOrgRole(userId, orgId) {
    const membership = await prisma.membership.findUnique({
      where: { userId_orgId: { userId, orgId } },
    });
    return membership?.role ?? null;
  },

  async getProjectOverride(userId, projectId) {
    const override = await prisma.projectMembership.findUnique({
      where: { userId_projectId: { userId, projectId } },
    });
    return override?.role ?? null;
  },

  async getProjectContext(projectId) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { orgId: true, visibility: true },
    });
    return project ?? null;
  },
};
