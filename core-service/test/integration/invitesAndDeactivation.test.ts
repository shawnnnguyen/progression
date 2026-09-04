import { afterAll, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildTestApp } from "../fixtures/testApp.js";
import { resetDatabase, disconnectDatabase } from "../fixtures/db.js";
import { addOrgMember, authHeader, createOrgWithOwner, createProjectFixture, createUser } from "../fixtures/factories.js";

let app: FastifyInstance;

beforeEach(async () => {
  await resetDatabase();
  app = await buildTestApp();
});

afterAll(async () => {
  await app?.close();
  await disconnectDatabase();
});

// Regression coverage for the invite-accept authorization bugs: acceptInvite
// used to trust the invite ID alone (not a secret — it's returned to org
// admins and is the route path segment) and upserted the Membership role,
// which let any authenticated user join any org at any role, and let a
// re-accept silently overwrite an existing role (including a sole OWNER's).
describe("invite accept requires the token and a matching email", () => {
  it("accepts with the correct token and the invited user's own email", async () => {
    const owner = await createUser("Owner");
    const org = await createOrgWithOwner(owner.id, "Acme");
    const invitee = await createUser("Invitee");

    const inviteRes = await app.inject({
      method: "POST",
      url: `/api/v1/orgs/${org.id}/invites`,
      headers: authHeader(owner.id),
      payload: { email: invitee.email, role: "MEMBER" },
    });
    expect(inviteRes.statusCode).toBe(201);
    expect(inviteRes.json().data.invite.tokenHash).toBeUndefined();
    const { invite, token } = inviteRes.json().data;

    const acceptRes = await app.inject({
      method: "POST",
      url: `/api/v1/invites/${invite.id}/accept`,
      headers: authHeader(invitee.id),
      payload: { token },
    });
    expect(acceptRes.statusCode).toBe(200);
    expect(acceptRes.json().data.role).toBe("MEMBER");
  });

  it("rejects acceptance with a wrong token, even from the correct invitee", async () => {
    const owner = await createUser("Owner");
    const org = await createOrgWithOwner(owner.id, "Acme");
    const invitee = await createUser("Invitee");

    const inviteRes = await app.inject({
      method: "POST",
      url: `/api/v1/orgs/${org.id}/invites`,
      headers: authHeader(owner.id),
      payload: { email: invitee.email, role: "ADMIN" },
    });
    const { invite } = inviteRes.json().data;

    const acceptRes = await app.inject({
      method: "POST",
      url: `/api/v1/invites/${invite.id}/accept`,
      headers: authHeader(invitee.id),
      payload: { token: "wrong-token" },
    });
    expect(acceptRes.statusCode).toBe(400);

    const membersRes = await app.inject({
      method: "GET",
      url: `/api/v1/orgs/${org.id}/members`,
      headers: authHeader(owner.id),
    });
    expect(membersRes.json().data.some((m: { userId: string }) => m.userId === invitee.id)).toBe(false);
  });

  it("rejects acceptance by a user whose email doesn't match the invite, even with a valid token for a DIFFERENT invite", async () => {
    const owner = await createUser("Owner");
    const org = await createOrgWithOwner(owner.id, "Acme");
    const invitee = await createUser("Invitee");
    const mallory = await createUser("Mallory");

    const inviteRes = await app.inject({
      method: "POST",
      url: `/api/v1/orgs/${org.id}/invites`,
      headers: authHeader(owner.id),
      payload: { email: invitee.email, role: "ADMIN" },
    });
    const { invite, token } = inviteRes.json().data;

    // Mallory has no invite of her own but knows the (public, non-secret)
    // invite ID and somehow obtained the token value — even so, the email
    // check must block her.
    const acceptRes = await app.inject({
      method: "POST",
      url: `/api/v1/invites/${invite.id}/accept`,
      headers: authHeader(mallory.id),
      payload: { token },
    });
    expect(acceptRes.statusCode).toBe(400);
  });

  it("rejects re-accepting when the user already holds a Membership in the org (no silent role overwrite)", async () => {
    const owner = await createUser("Owner");
    const org = await createOrgWithOwner(owner.id, "Acme");

    // Owner "invites themselves" at a lower role — simulates a stale invite
    // being accepted by someone who already has a Membership row.
    const inviteRes = await app.inject({
      method: "POST",
      url: `/api/v1/orgs/${org.id}/invites`,
      headers: authHeader(owner.id),
      payload: { email: owner.email, role: "MEMBER" },
    });
    const { invite, token } = inviteRes.json().data;

    const acceptRes = await app.inject({
      method: "POST",
      url: `/api/v1/invites/${invite.id}/accept`,
      headers: authHeader(owner.id),
      payload: { token },
    });
    expect(acceptRes.statusCode).toBe(409);

    const membersRes = await app.inject({
      method: "GET",
      url: `/api/v1/orgs/${org.id}/members`,
      headers: authHeader(owner.id),
    });
    const ownerMembership = membersRes.json().data.find((m: { userId: string }) => m.userId === owner.id);
    expect(ownerMembership.role).toBe("OWNER");
  });
});

describe("user deactivation actually revokes access", () => {
  it("a deactivated user's refresh token is revoked and can no longer mint a new access token", async () => {
    const owner = await createUser("Owner");
    await createOrgWithOwner(owner.id, "Acme");

    const loginRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email: owner.email, password: "password123!" },
    });
    const refreshCookie = loginRes.cookies.find((c) => c.name === "refreshToken")!;

    const deactivateRes = await app.inject({
      method: "POST",
      url: "/api/v1/me/deactivate",
      headers: authHeader(owner.id),
    });
    expect(deactivateRes.statusCode).toBe(204);

    const refreshRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/refresh",
      cookies: { refreshToken: refreshCookie.value },
    });
    expect(refreshRes.statusCode).toBe(401);

    const loginAgainRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email: owner.email, password: "password123!" },
    });
    expect(loginAgainRes.statusCode).toBe(401);
  });

  it("an ADMIN cannot deactivate the org OWNER", async () => {
    const owner = await createUser("Owner");
    const admin = await createUser("Admin");
    const org = await createOrgWithOwner(owner.id, "Acme");
    await addOrgMember(org.id, admin.id, "ADMIN");

    const res = await app.inject({
      method: "POST",
      url: `/api/v1/users/${owner.id}/deactivate`,
      headers: authHeader(admin.id),
    });
    expect(res.statusCode).toBe(403);
  });

  it("an ADMIN can deactivate an ordinary MEMBER", async () => {
    const owner = await createUser("Owner");
    const admin = await createUser("Admin");
    const member = await createUser("Member");
    const org = await createOrgWithOwner(owner.id, "Acme");
    await addOrgMember(org.id, admin.id, "ADMIN");
    await addOrgMember(org.id, member.id, "MEMBER");

    const res = await app.inject({
      method: "POST",
      url: `/api/v1/users/${member.id}/deactivate`,
      headers: authHeader(admin.id),
    });
    expect(res.statusCode).toBe(204);
  });
});

describe("/me/tickets is scoped to projects the caller can currently access", () => {
  it("excludes tickets assigned in a project the caller has since lost access to", async () => {
    const owner = await createUser("Owner");
    const org = await createOrgWithOwner(owner.id, "Acme");
    const project = await createProjectFixture(org.id, owner.id, { key: "ENG" });

    const teammate = await createUser("Teammate");
    await addOrgMember(org.id, teammate.id, "MEMBER");

    const ticketRes = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project.id}/tickets`,
      headers: authHeader(owner.id),
      payload: { title: "Assigned work", assigneeId: teammate.id },
    });
    expect(ticketRes.statusCode).toBe(201);

    const before = await app.inject({
      method: "GET",
      url: "/api/v1/me/tickets",
      headers: authHeader(teammate.id),
    });
    expect(before.json().data.some((t: { title: string }) => t.title === "Assigned work")).toBe(true);

    await app.inject({
      method: "DELETE",
      url: `/api/v1/orgs/${org.id}/members/${teammate.id}`,
      headers: authHeader(owner.id),
    });

    const after = await app.inject({
      method: "GET",
      url: "/api/v1/me/tickets",
      headers: authHeader(teammate.id),
    });
    expect(after.statusCode).toBe(200);
    expect(after.json().data.some((t: { title: string }) => t.title === "Assigned work")).toBe(false);
  });

  it("rejects assigning a ticket to a user with no access to the project", async () => {
    const owner = await createUser("Owner");
    const org = await createOrgWithOwner(owner.id, "Acme");
    const project = await createProjectFixture(org.id, owner.id, { key: "ENG" });
    const outsider = await createUser("Outsider");

    const res = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project.id}/tickets`,
      headers: authHeader(owner.id),
      payload: { title: "Bad assignment", assigneeId: outsider.id },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe("ticket search filter survives pagination", () => {
  it("keeps applying ?q= on the second page, not just the first", async () => {
    const owner = await createUser("Owner");
    const org = await createOrgWithOwner(owner.id, "Acme");
    const project = await createProjectFixture(org.id, owner.id, { key: "ENG" });

    for (let i = 0; i < 3; i++) {
      await app.inject({
        method: "POST",
        url: `/api/v1/projects/${project.id}/tickets`,
        headers: authHeader(owner.id),
        payload: { title: `other ${i}` },
      });
    }
    for (let i = 0; i < 3; i++) {
      await app.inject({
        method: "POST",
        url: `/api/v1/projects/${project.id}/tickets`,
        headers: authHeader(owner.id),
        payload: { title: `MATCHME ${i}` },
      });
    }

    const page1 = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${project.id}/tickets?q=MATCHME&limit=2`,
      headers: authHeader(owner.id),
    });
    expect(page1.json().data.every((t: { title: string }) => t.title.includes("MATCHME"))).toBe(true);
    expect(page1.json().nextCursor).toBeTruthy();

    const page2 = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${project.id}/tickets?q=MATCHME&limit=2&cursor=${encodeURIComponent(page1.json().nextCursor)}`,
      headers: authHeader(owner.id),
    });
    expect(page2.json().data.length).toBeGreaterThan(0);
    expect(page2.json().data.every((t: { title: string }) => t.title.includes("MATCHME"))).toBe(true);
  });
});
