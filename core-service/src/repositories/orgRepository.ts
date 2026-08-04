import { prisma } from "./prismaClient.js";
import type { OrgRepository } from "../services/membershipService.js";

export const orgRepository: OrgRepository = {
  async createOrg(name, slug, ownerUserId) {
    return prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({ data: { name, slug } });
      await tx.membership.create({ data: { userId: ownerUserId, orgId: org.id, role: "OWNER" } });
      return org;
    });
  },

  async findOrgById(orgId) {
    return prisma.organization.findUnique({ where: { id: orgId } });
  },

  async findOrgBySlug(slug) {
    return prisma.organization.findUnique({ where: { slug } });
  },

  async listOrgsForUser(userId) {
    return prisma.organization.findMany({
      where: { memberships: { some: { userId } } },
      orderBy: { createdAt: "asc" },
    });
  },

  async updateOrg(orgId, patch) {
    return prisma.organization.update({ where: { id: orgId }, data: patch });
  },
};
