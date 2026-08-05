import { afterAll, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildTestApp } from "../fixtures/testApp.js";
import { resetDatabase, disconnectDatabase } from "../fixtures/db.js";
import { addOrgMember, authHeader, createOrgWithOwner, createUser } from "../fixtures/factories.js";

let app: FastifyInstance;

beforeEach(async () => {
  await resetDatabase();
  app = await buildTestApp();
});

afterAll(async () => {
  await app?.close();
  await disconnectDatabase();
});

describe("org + project CRUD round trip", () => {
  it("creates an org, invites a member as project admin, and resolves roles correctly", async () => {
    const owner = await createUser("Owner");
    const contractor = await createUser("Contractor");

    const org = await createOrgWithOwner(owner.id, "Acme");
    await addOrgMember(org.id, contractor.id, "MEMBER");

    const createProject = await app.inject({
      method: "POST",
      url: `/api/v1/orgs/${org.id}/projects`,
      headers: authHeader(owner.id),
      payload: { key: "ENG", name: "Engineering" },
    });
    expect(createProject.statusCode).toBe(201);
    const project = createProject.json().data;

    const override = await app.inject({
      method: "PUT",
      url: `/api/v1/projects/${project.id}/members/${contractor.id}`,
      headers: authHeader(owner.id),
      payload: { role: "ADMIN" },
    });
    expect(override.statusCode).toBe(200);

    const members = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${project.id}/members`,
      headers: authHeader(owner.id),
    });
    expect(members.statusCode).toBe(200);
    const contractorEntry = members.json().data.find((m: { userId: string }) => m.userId === contractor.id);
    expect(contractorEntry.role).toBe("ADMIN");
    expect(contractorEntry.source).toBe("override");
  });

  it("rejects a non-owner/admin from creating a project", async () => {
    const owner = await createUser("Owner");
    const viewer = await createUser("Viewer");
    const org = await createOrgWithOwner(owner.id, "Acme");
    await addOrgMember(org.id, viewer.id, "VIEWER");

    const res = await app.inject({
      method: "POST",
      url: `/api/v1/orgs/${org.id}/projects`,
      headers: authHeader(viewer.id),
      payload: { key: "ENG", name: "Engineering" },
    });
    expect(res.statusCode).toBe(403);
    expect(res.json().error.code).toBe("FORBIDDEN");
  });
});

describe("org member list identity enrichment", () => {
  it("includes each member's name and avatarUrl alongside role", async () => {
    const owner = await createUser("Olivia Owner");
    const member = await createUser("Max Member");
    const org = await createOrgWithOwner(owner.id, "Acme");
    await addOrgMember(org.id, member.id, "MEMBER");

    const res = await app.inject({
      method: "GET",
      url: `/api/v1/orgs/${org.id}/members`,
      headers: authHeader(owner.id),
    });
    expect(res.statusCode).toBe(200);

    const rows: Array<{ userId: string; name: string; avatarUrl: string | null }> = res.json().data;
    const ownerEntry = rows.find((r) => r.userId === owner.id);
    const memberEntry = rows.find((r) => r.userId === member.id);
    expect(ownerEntry?.name).toBe("Olivia Owner");
    expect(memberEntry?.name).toBe("Max Member");
    expect(memberEntry?.avatarUrl).toBeNull();
  });
});

describe("org member role changes and the last-owner invariant", () => {
  it("rejects demoting the sole owner (409 LAST_OWNER)", async () => {
    const owner = await createUser("Owner");
    const org = await createOrgWithOwner(owner.id, "Acme");

    const res = await app.inject({
      method: "PATCH",
      url: `/api/v1/orgs/${org.id}/members/${owner.id}`,
      headers: authHeader(owner.id),
      payload: { role: "MEMBER" },
    });
    expect(res.statusCode).toBe(409);
    expect(res.json().error.code).toBe("LAST_OWNER");
  });

  it("rejects an ADMIN changing an OWNER's role (403)", async () => {
    const owner = await createUser("Owner");
    const admin = await createUser("Admin");
    const org = await createOrgWithOwner(owner.id, "Acme");
    await addOrgMember(org.id, admin.id, "ADMIN");

    const res = await app.inject({
      method: "PATCH",
      url: `/api/v1/orgs/${org.id}/members/${owner.id}`,
      headers: authHeader(admin.id),
      payload: { role: "MEMBER" },
    });
    expect(res.statusCode).toBe(403);
  });

  it("removing a member cascades: they lose project overrides and their refresh tokens are revoked", async () => {
    const owner = await createUser("Owner");
    const member = await createUser("Member");
    const org = await createOrgWithOwner(owner.id, "Acme");
    await addOrgMember(org.id, member.id, "MEMBER");

    const projectRes = await app.inject({
      method: "POST",
      url: `/api/v1/orgs/${org.id}/projects`,
      headers: authHeader(owner.id),
      payload: { key: "ENG", name: "Engineering" },
    });
    const project = projectRes.json().data;

    await app.inject({
      method: "PUT",
      url: `/api/v1/projects/${project.id}/members/${member.id}`,
      headers: authHeader(owner.id),
      payload: { role: "ADMIN" },
    });

    const loginRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email: member.email, password: "password123!" },
    });
    expect(loginRes.statusCode).toBe(200);

    const removeRes = await app.inject({
      method: "DELETE",
      url: `/api/v1/orgs/${org.id}/members/${member.id}`,
      headers: authHeader(owner.id),
    });
    expect(removeRes.statusCode).toBe(204);

    const projectAccess = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${project.id}`,
      headers: authHeader(member.id),
    });
    expect(projectAccess.statusCode).toBe(404);

    const refreshCookie = loginRes.cookies.find((c) => c.name === "refreshToken")!;
    const refreshRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/refresh",
      cookies: { refreshToken: refreshCookie.value },
    });
    expect(refreshRes.statusCode).toBe(401);
  });
});
