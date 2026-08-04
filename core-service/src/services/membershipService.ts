import crypto from "node:crypto";
import { ConflictError, ForbiddenError, LastOwnerError, NotFoundError, ValidationError } from "../errors/index.js";
import { can, type Actor, type AuthzDeps, type OrgRole } from "./authz.js";
import type { AuditEventRow, InviteRow, MembershipRow, OrganizationRow, Page } from "./types.js";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface OrgRepository {
  createOrg(name: string, slug: string, ownerUserId: string): Promise<OrganizationRow>;
  findOrgById(orgId: string): Promise<OrganizationRow | null>;
  findOrgBySlug(slug: string): Promise<OrganizationRow | null>;
  listOrgsForUser(userId: string): Promise<OrganizationRow[]>;
  updateOrg(orgId: string, patch: { name?: string }): Promise<OrganizationRow>;
}

export interface MembershipRepository {
  findMembershipByUserAndOrg(userId: string, orgId: string): Promise<MembershipRow | null>;
  listMembershipsForOrg(orgId: string): Promise<MembershipRow[]>;
  countActiveOwnersForOrg(orgId: string): Promise<number>;
  changeMembershipRole(orgId: string, userId: string, role: OrgRole): Promise<MembershipRow>;

  removeMemberCascade(orgId: string, userId: string): Promise<void>;

  hasAdminOverlapWithUser(actorUserId: string, targetUserId: string): Promise<boolean>;

  isOwnerAnywhere(userId: string): Promise<boolean>;
}

export interface UserDeactivationRepository {
  findUserById(userId: string): Promise<{ email: string; deactivatedAt: Date | null } | null>;
  deactivateUser(userId: string): Promise<void>;
}

export interface RefreshTokenRevocationRepository {
  revokeAllRefreshTokensForUser(userId: string): Promise<void>;
}

export type AcceptInviteResult =
  | { status: "ok"; membership: MembershipRow }
  | { status: "invalid" }
  | { status: "already_member" };

export interface InviteRepository {
  createInvite(orgId: string, email: string, role: OrgRole, invitedById: string, tokenHash: string, expiresAt: Date): Promise<InviteRow>;
  listInvitesForOrg(orgId: string): Promise<InviteRow[]>;
  findInviteById(inviteId: string): Promise<InviteRow | null>;
  revokeInvite(inviteId: string): Promise<void>;

  acceptInviteWithToken(inviteId: string, token: string, userId: string, userEmail: string): Promise<AcceptInviteResult>;
}

export interface AuditEventRepository {
  recordAuditEvent(orgId: string, type: "ORG_ROLE_CHANGED" | "ORG_MEMBER_REMOVED", data: Record<string, unknown>, actorUserId: string): Promise<void>;
  listAuditEventsForOrg(orgId: string, cursor?: string | null, limit?: number): Promise<Page<AuditEventRow>>;
}

export interface MembershipServiceDeps extends AuthzDeps {
  orgs: OrgRepository;
  memberships: MembershipRepository;
  invites: InviteRepository;
  auditLog: AuditEventRepository;
  users: UserDeactivationRepository;
  refreshTokens: RefreshTokenRevocationRepository;
}

export async function createOrg(actor: Actor, name: string, slug: string, deps: MembershipServiceDeps): Promise<OrganizationRow> {
  if (await deps.orgs.findOrgBySlug(slug)) {
    throw new ConflictError("An organization with this slug already exists");
  }
  return deps.orgs.createOrg(name, slug, actor.userId);
}

export async function listMyOrgs(actor: Actor, deps: MembershipServiceDeps): Promise<OrganizationRow[]> {
  return deps.orgs.listOrgsForUser(actor.userId);
}

export async function getOrg(actor: Actor, orgId: string, deps: MembershipServiceDeps): Promise<OrganizationRow> {
  const result = await can(deps, actor, "org:read", { kind: "org", orgId });
  if (result === "NOT_FOUND") throw new NotFoundError("Organization not found");
  if (result === "FORBIDDEN") throw new ForbiddenError();
  const org = await deps.orgs.findOrgById(orgId);
  if (!org) throw new NotFoundError("Organization not found");
  return org;
}

export async function updateOrg(actor: Actor, orgId: string, patch: { name?: string }, deps: MembershipServiceDeps): Promise<OrganizationRow> {
  const result = await can(deps, actor, "org:update", { kind: "org", orgId });
  if (result === "NOT_FOUND") throw new NotFoundError("Organization not found");
  if (result === "FORBIDDEN") throw new ForbiddenError();
  return deps.orgs.updateOrg(orgId, patch);
}

export async function inviteMember(
  actor: Actor,
  orgId: string,
  email: string,
  role: OrgRole,
  deps: MembershipServiceDeps,
): Promise<{ invite: InviteRow; plaintextToken: string }> {
  const result = await can(deps, actor, "org:member:invite", { kind: "org", orgId });
  if (result === "NOT_FOUND") throw new NotFoundError("Organization not found");
  if (result === "FORBIDDEN") throw new ForbiddenError();
  if (role === "OWNER") {
    throw new ValidationError("Owner transfer is not supported in v1 — no invite may grant OWNER");
  }

  const plaintextToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(plaintextToken).digest("hex");
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS);

  const invite = await deps.invites.createInvite(orgId, email, role, actor.userId, tokenHash, expiresAt);
  return { invite, plaintextToken };
}

export async function listInvites(actor: Actor, orgId: string, deps: MembershipServiceDeps): Promise<InviteRow[]> {
  const result = await can(deps, actor, "org:member:invite", { kind: "org", orgId });
  if (result === "NOT_FOUND") throw new NotFoundError("Organization not found");
  if (result === "FORBIDDEN") throw new ForbiddenError();
  return deps.invites.listInvitesForOrg(orgId);
}

export async function revokeInvite(actor: Actor, orgId: string, inviteId: string, deps: MembershipServiceDeps): Promise<void> {
  const result = await can(deps, actor, "org:member:invite", { kind: "org", orgId });
  if (result === "NOT_FOUND") throw new NotFoundError("Organization not found");
  if (result === "FORBIDDEN") throw new ForbiddenError();
  const invite = await deps.invites.findInviteById(inviteId);
  if (!invite || invite.orgId !== orgId) throw new NotFoundError("Invite not found");
  await deps.invites.revokeInvite(inviteId);
}

export async function acceptInvite(
  actor: Actor,
  inviteId: string,
  token: string,
  deps: MembershipServiceDeps,
): Promise<MembershipRow> {
  const user = await deps.users.findUserById(actor.userId);
  if (!user) throw new NotFoundError("User not found");

  const result = await deps.invites.acceptInviteWithToken(inviteId, token, actor.userId, user.email);
  if (result.status === "invalid") throw new ValidationError("This invite is invalid, expired, or the token is wrong");
  if (result.status === "already_member") throw new ConflictError("You are already a member of this organization");
  return result.membership;
}

export async function listOrgMembers(actor: Actor, orgId: string, deps: MembershipServiceDeps): Promise<MembershipRow[]> {
  const result = await can(deps, actor, "org:read", { kind: "org", orgId });
  if (result === "NOT_FOUND") throw new NotFoundError("Organization not found");
  if (result === "FORBIDDEN") throw new ForbiddenError();
  return deps.memberships.listMembershipsForOrg(orgId);
}

// GET .../audit-events (§7 Milestone 8's demo) — the security/administrative
// trail was write-only until this: writes happened everywhere the plan
// requires (role changes, removals, project lifecycle) but nothing ever
// read them back.
export async function listAuditEvents(
  actor: Actor,
  orgId: string,
  deps: MembershipServiceDeps,
  cursor?: string | null,
  limit?: number,
): Promise<Page<AuditEventRow>> {
  const result = await can(deps, actor, "org:audit:read", { kind: "org", orgId });
  if (result === "NOT_FOUND") throw new NotFoundError("Organization not found");
  if (result === "FORBIDDEN") throw new ForbiddenError();
  return deps.auditLog.listAuditEventsForOrg(orgId, cursor, limit);
}

export async function changeOrgRole(
  actor: Actor,
  orgId: string,
  targetUserId: string,
  newRole: OrgRole,
  deps: MembershipServiceDeps,
): Promise<MembershipRow> {
  const target = await deps.memberships.findMembershipByUserAndOrg(targetUserId, orgId);
  if (!target) throw new NotFoundError("Member not found");

  const result = await can(deps, actor, "org:member:role:change", {
    kind: "org",
    orgId,
    targetOrgRole: target.role,
  });
  if (result === "NOT_FOUND") throw new NotFoundError("Organization not found");
  if (result === "FORBIDDEN") throw new ForbiddenError();

  if (newRole === "OWNER") {
    throw new ValidationError("Owner transfer is not supported in v1 — no role change may set OWNER");
  }

  if (target.role === "OWNER" && (await deps.memberships.countActiveOwnersForOrg(orgId)) <= 1) {
    throw new LastOwnerError();
  }

  const updated = await deps.memberships.changeMembershipRole(orgId, targetUserId, newRole);
  await deps.auditLog.recordAuditEvent(orgId, "ORG_ROLE_CHANGED", { targetUserId, from: target.role, to: newRole }, actor.userId);
  return updated;
}

export async function removeOrgMember(
  actor: Actor,
  orgId: string,
  targetUserId: string,
  deps: MembershipServiceDeps,
): Promise<void> {
  const target = await deps.memberships.findMembershipByUserAndOrg(targetUserId, orgId);
  if (!target) throw new NotFoundError("Member not found");

  const result = await can(deps, actor, "org:member:remove", {
    kind: "org",
    orgId,
    targetOrgRole: target.role,
  });
  if (result === "NOT_FOUND") throw new NotFoundError("Organization not found");
  if (result === "FORBIDDEN") throw new ForbiddenError();

  if (target.role === "OWNER" && (await deps.memberships.countActiveOwnersForOrg(orgId)) <= 1) {
    throw new LastOwnerError();
  }

  await deps.memberships.removeMemberCascade(orgId, targetUserId);
  await deps.auditLog.recordAuditEvent(orgId, "ORG_MEMBER_REMOVED", { targetUserId }, actor.userId);
}

export async function deactivateOtherUser(actor: Actor, targetUserId: string, deps: MembershipServiceDeps): Promise<void> {
  if (!(await deps.memberships.hasAdminOverlapWithUser(actor.userId, targetUserId))) {
    throw new ForbiddenError();
  }
  if (await deps.memberships.isOwnerAnywhere(targetUserId)) {
    throw new ForbiddenError();
  }
  await deps.users.deactivateUser(targetUserId);
  await deps.refreshTokens.revokeAllRefreshTokensForUser(targetUserId);
}
