import { afterAll, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildTestApp } from "../fixtures/testApp.js";
import { resetDatabase, disconnectDatabase } from "../fixtures/db.js";
import { authHeader, createOrgWithOwner, createProjectFixture, createUser } from "../fixtures/factories.js";

let app: FastifyInstance;

beforeEach(async () => {
  await resetDatabase();
  app = await buildTestApp();
});

afterAll(async () => {
  await app?.close();
  await disconnectDatabase();
});

// A user in org A requesting any org-B-scoped resource ID must get 404,
// never 403 or a 200 with someone else's data — the whole point of can()
// returning NOT_FOUND instead of a boolean (§2).
describe("cross-org isolation", () => {
  it("a stranger org's member gets 404 for another org's project", async () => {
    const ownerA = await createUser("Owner A");
    const orgA = await createOrgWithOwner(ownerA.id, "Org A");
    const projectA = await createProjectFixture(orgA.id, ownerA.id, { key: "ENG" });

    const outsider = await createUser("Outsider");
    await createOrgWithOwner(outsider.id, "Org B"); // outsider only belongs to org B

    const res = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${projectA.id}`,
      headers: authHeader(outsider.id),
    });
    expect(res.statusCode).toBe(404);
    expect(res.json().error.code).toBe("NOT_FOUND");
  });

  it("a stranger org's member gets 404 for another org's ticket", async () => {
    const ownerA = await createUser("Owner A");
    const orgA = await createOrgWithOwner(ownerA.id, "Org A");
    const projectA = await createProjectFixture(orgA.id, ownerA.id, { key: "ENG" });
    const ticket = (
      await app.inject({
        method: "POST",
        url: `/api/v1/projects/${projectA.id}/tickets`,
        headers: authHeader(ownerA.id),
        payload: { title: "Secret work" },
      })
    ).json().data;

    const outsider = await createUser("Outsider");
    await createOrgWithOwner(outsider.id, "Org B");

    const res = await app.inject({
      method: "GET",
      url: `/api/v1/tickets/${ticket.id}`,
      headers: authHeader(outsider.id),
    });
    expect(res.statusCode).toBe(404);
  });

  it("a stranger org's member gets 404 for another org's sprint and label", async () => {
    const ownerA = await createUser("Owner A");
    const orgA = await createOrgWithOwner(ownerA.id, "Org A");
    const projectA = await createProjectFixture(orgA.id, ownerA.id, { key: "ENG" });

    const labelRes = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${projectA.id}/labels`,
      headers: authHeader(ownerA.id),
      payload: { name: "bug", color: "#ff0000" },
    });
    const label = labelRes.json().data;

    const sprintRes = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${projectA.id}/sprints`,
      headers: authHeader(ownerA.id),
      payload: { name: "Sprint 1", startDate: "2026-01-01T00:00:00Z", endDate: "2026-01-14T00:00:00Z" },
    });
    const sprint = sprintRes.json().data;

    const outsider = await createUser("Outsider");
    await createOrgWithOwner(outsider.id, "Org B");

    const labelAccess = await app.inject({
      method: "PATCH",
      url: `/api/v1/labels/${label.id}`,
      headers: authHeader(outsider.id),
      payload: { name: "renamed" },
    });
    expect(labelAccess.statusCode).toBe(404);

    const sprintAccess = await app.inject({
      method: "GET",
      url: `/api/v1/sprints/${sprint.id}`,
      headers: authHeader(outsider.id),
    });
    expect(sprintAccess.statusCode).toBe(404);
  });

  it("a PRIVATE project is invisible to an org member with no explicit override", async () => {
    const owner = await createUser("Owner");
    const org = await createOrgWithOwner(owner.id, "Acme");
    const project = await createProjectFixture(org.id, owner.id, { key: "SEC", visibility: "PRIVATE" });

    const otherMember = await createUser("Other member");
    const { addOrgMember } = await import("../fixtures/factories.js");
    await addOrgMember(org.id, otherMember.id, "MEMBER");

    const res = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${project.id}`,
      headers: authHeader(otherMember.id),
    });
    expect(res.statusCode).toBe(404);
  });
});
