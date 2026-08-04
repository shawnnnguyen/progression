import jwt from "jsonwebtoken";
import { config } from "../../src/config.js";
import { prisma } from "../../src/repositories/prismaClient.js";
import * as authService from "../../src/services/authService.js";
import * as membershipService from "../../src/services/membershipService.js";
import { authDeps, membershipDeps } from "../../src/deps.js";
import type { Actor, OrgRole } from "../../src/services/authz.js";

let counter = 0;
function unique(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now()}-${counter}`;
}

export async function createUser(name = "Test User") {
  const email = `${unique("user")}@example.com`;
  return authService.register({ email, name, password: "password123!" }, authDeps);
}

export function actorFor(userId: string): Actor {
  return { userId, actorType: "user" };
}

export function signAccessToken(userId: string): string {
  return jwt.sign({ actorType: "user" }, config.jwt.accessSecret, {
    subject: userId,
    expiresIn: config.jwt.accessTtlSeconds,
  });
}

export function authHeader(userId: string): { authorization: string } {
  return { authorization: `Bearer ${signAccessToken(userId)}` };
}

export async function createOrgWithOwner(ownerUserId: string, name = "Test Org") {
  return membershipService.createOrg(actorFor(ownerUserId), name, unique("org"), membershipDeps);
}

/** Direct-inserts a Membership row — fixture convenience, not exercising the invite/accept flow (that has its own test). */
export async function addOrgMember(orgId: string, userId: string, role: OrgRole) {
  return prisma.membership.upsert({
    where: { userId_orgId: { userId, orgId } },
    create: { userId, orgId, role },
    update: { role },
  });
}

function uniqueProjectKey(): string {
  counter += 1;
  return `P${counter.toString(36).toUpperCase()}`;
}

export async function createProjectFixture(
  orgId: string,
  actorUserId: string,
  overrides: { key?: string; name?: string; visibility?: "ORG" | "PRIVATE" } = {},
) {
  const projectService = await import("../../src/services/projectService.js");
  const { projectDeps } = await import("../../src/deps.js");
  return projectService.createProject(
    actorFor(actorUserId),
    orgId,
    {
      key: overrides.key ?? uniqueProjectKey(),
      name: overrides.name ?? "Test Project",
      visibility: overrides.visibility,
    },
    projectDeps,
  );
}
