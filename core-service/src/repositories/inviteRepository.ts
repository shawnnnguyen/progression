import crypto from "node:crypto";
import { prisma } from "./prismaClient.js";
import type { InviteRepository } from "../services/membershipService.js";

// Selected explicitly everywhere so tokenHash — a hash, not a secret in
// itself, but still not something a client needs — never rides along in a
// JSON response just because it happens to be a column on the Prisma row.
const INVITE_SELECT = {
  id: true,
  orgId: true,
  email: true,
  role: true,
  invitedById: true,
  expiresAt: true,
  acceptedAt: true,
  revokedAt: true,
  createdAt: true,
} as const;

export const inviteRepository: InviteRepository = {
  // @@unique([orgId, email]) means "re-inviting" is an upsert, not a second
  // row — the old invite (whatever its status) is replaced in place rather
  // than colliding on the constraint.
  async createInvite(orgId, email, role, invitedById, tokenHash, expiresAt) {
    return prisma.invite.upsert({
      where: { orgId_email: { orgId, email } },
      create: { orgId, email, role, invitedById, tokenHash, expiresAt },
      update: { role, invitedById, tokenHash, expiresAt, acceptedAt: null, revokedAt: null },
      select: INVITE_SELECT,
    });
  },

  async listInvitesForOrg(orgId) {
    return prisma.invite.findMany({ where: { orgId }, orderBy: { createdAt: "desc" }, select: INVITE_SELECT });
  },

  async findInviteById(inviteId) {
    return prisma.invite.findUnique({ where: { id: inviteId }, select: INVITE_SELECT });
  },

  async revokeInvite(inviteId) {
    await prisma.invite.update({ where: { id: inviteId }, data: { revokedAt: new Date() } });
  },

  async acceptInviteWithToken(inviteId, token, userId, userEmail) {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    return prisma.$transaction(async (tx) => {
      const invite = await tx.invite.findUnique({ where: { id: inviteId } });
      if (
        !invite ||
        invite.revokedAt ||
        invite.acceptedAt ||
        invite.expiresAt < new Date() ||
        invite.tokenHash !== tokenHash ||
        invite.email.toLowerCase() !== userEmail.toLowerCase()
      ) {
        return { status: "invalid" as const };
      }

      const existing = await tx.membership.findUnique({ where: { userId_orgId: { userId, orgId: invite.orgId } } });
      if (existing) {
        return { status: "already_member" as const };
      }

      await tx.invite.update({ where: { id: inviteId }, data: { acceptedAt: new Date() } });
      const membership = await tx.membership.create({ data: { userId, orgId: invite.orgId, role: invite.role } });
      return { status: "ok" as const, membership };
    });
  },
};
