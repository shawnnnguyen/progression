import { prisma } from "./prismaClient.js";
import type { MembershipRepository } from "../services/membershipService.js";

export const membershipRepository: MembershipRepository = {
  async findMembershipByUserAndOrg(userId, orgId) {
    return prisma.membership.findUnique({ where: { userId_orgId: { userId, orgId } } });
  },

  async listMembershipsForOrg(orgId) {
    const memberships = await prisma.membership.findMany({
      where: { orgId },
      orderBy: { createdAt: "asc" },
      include: { user: { select: { name: true, avatarUrl: true } } },
    });
    return memberships.map(({ user, ...m }) => ({ ...m, name: user.name, avatarUrl: user.avatarUrl }));
  },

  async countActiveOwnersForOrg(orgId) {
    return prisma.membership.count({ where: { orgId, role: "OWNER" } });
  },

  async changeMembershipRole(orgId, userId, role) {
    return prisma.membership.update({
      where: { userId_orgId: { userId, orgId } },
      data: { role },
    });
  },

  async isOwnerAnywhere(userId) {
    const count = await prisma.membership.count({ where: { userId, role: "OWNER" } });
    return count > 0;
  },

  async hasAdminOverlapWithUser(actorUserId, targetUserId) {
    const adminOrgs = await prisma.membership.findMany({
      where: { userId: actorUserId, role: { in: ["OWNER", "ADMIN"] } },
      select: { orgId: true },
    });
    if (adminOrgs.length === 0) return false;
    const count = await prisma.membership.count({
      where: { userId: targetUserId, orgId: { in: adminOrgs.map((m) => m.orgId) } },
    });
    return count > 0;
  },

  // Org removal cascade (§2): one transaction deletes the Membership row,
  // every ProjectMembership override the user holds in this org's projects,
  // and revokes their RefreshTokens — "loses all access immediately" is
  // enforced here, not left as an incidental side effect of one row deletion.
  async removeMemberCascade(orgId, userId) {
    await prisma.$transaction([
      prisma.projectMembership.deleteMany({ where: { userId, project: { orgId } } }),
      prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
      prisma.membership.delete({ where: { userId_orgId: { userId, orgId } } }),
    ]);
  },
};
