import { prisma } from "./prismaClient.js";
import { seedDefaultWorkflow } from "./workflowRepository.js";
import type { ProjectRepository, EffectiveProjectMember } from "../services/projectService.js";
import type { ProjectRole } from "../services/authz.js";

const PROJECT_ROLE_RANK: Record<ProjectRole, number> = { VIEWER: 0, MEMBER: 1, ADMIN: 2 };

function mapOrgRoleToProjectRole(orgRole: string): ProjectRole {
  if (orgRole === "OWNER" || orgRole === "ADMIN") return "ADMIN";
  if (orgRole === "MEMBER") return "MEMBER";
  return "VIEWER";
}

export const projectRepository: ProjectRepository = {
  async findProjectById(projectId) {
    return prisma.project.findUnique({ where: { id: projectId } });
  },

  async findProjectByOrgAndKey(orgId, key) {
    return prisma.project.findUnique({ where: { orgId_key: { orgId, key } } });
  },

  async listVisibleProjectsForOrg(orgId, actorUserId) {
    return prisma.project.findMany({
      where: {
        orgId,
        OR: [{ visibility: "ORG" }, { projectMemberships: { some: { userId: actorUserId } } }],
      },
      orderBy: { createdAt: "asc" },
    });
  },

  async createProject(orgId, input) {
    return prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          orgId,
          key: input.key,
          name: input.name,
          description: input.description ?? null,
          visibility: input.visibility ?? "ORG",
        },
      });
      await seedDefaultWorkflow(tx, project.id);
      return project;
    });
  },

  async updateProject(projectId, patch) {
    return prisma.project.update({ where: { id: projectId }, data: patch });
  },

  async archiveProject(projectId) {
    return prisma.project.update({ where: { id: projectId }, data: { archivedAt: new Date() } });
  },

  async listEffectiveProjectMembers(projectId): Promise<EffectiveProjectMember[]> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { orgId: true, visibility: true },
    });
    if (!project) return [];

    const overrides = await prisma.projectMembership.findMany({ where: { projectId } });

    if (project.visibility === "PRIVATE") {
      return overrides.map((o) => ({ userId: o.userId, role: o.role, source: "override" as const }));
    }

    const orgMembers = await prisma.membership.findMany({ where: { orgId: project.orgId } });
    const overrideByUser = new Map(overrides.map((o) => [o.userId, o.role]));

    return orgMembers.map((m): EffectiveProjectMember => {
      const override = overrideByUser.get(m.userId);
      if (override) {
        const floored = m.role === "OWNER" && PROJECT_ROLE_RANK[override] < PROJECT_ROLE_RANK.ADMIN ? "ADMIN" : override;
        return { userId: m.userId, role: floored, source: "override" };
      }
      return { userId: m.userId, role: mapOrgRoleToProjectRole(m.role), source: "org" };
    });
  },

  async setProjectMemberOverride(projectId, userId, role) {
    return prisma.projectMembership.upsert({
      where: { userId_projectId: { userId, projectId } },
      create: { userId, projectId, role },
      update: { role },
    });
  },

  async removeProjectMemberOverride(projectId, userId) {
    await prisma.projectMembership.deleteMany({ where: { userId, projectId } });
  },

  async isActiveOrgMember(orgId, userId) {
    const membership = await prisma.membership.findUnique({ where: { userId_orgId: { userId, orgId } } });
    return membership !== null;
  },
};
