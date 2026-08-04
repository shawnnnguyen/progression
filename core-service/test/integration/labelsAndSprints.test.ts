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

async function setupProject() {
  const owner = await createUser("Owner");
  const org = await createOrgWithOwner(owner.id, "Acme");
  const project = await createProjectFixture(org.id, owner.id, { key: "ENG" });
  return { owner, org, project };
}

describe("labels", () => {
  it("blocks deleting a label still applied to a ticket (409), then allows it once unapplied", async () => {
    const { owner, project } = await setupProject();

    const label = (
      await app.inject({
        method: "POST",
        url: `/api/v1/projects/${project.id}/labels`,
        headers: authHeader(owner.id),
        payload: { name: "bug", color: "#ff0000" },
      })
    ).json().data;

    const ticket = (
      await app.inject({
        method: "POST",
        url: `/api/v1/projects/${project.id}/tickets`,
        headers: authHeader(owner.id),
        payload: { title: "Buggy" },
      })
    ).json().data;

    const patchRes = await app.inject({
      method: "PATCH",
      url: `/api/v1/tickets/${ticket.id}`,
      headers: authHeader(owner.id),
      payload: { version: ticket.version, labelIds: [label.id] },
    });
    expect(patchRes.statusCode).toBe(200);

    const blockedDelete = await app.inject({
      method: "DELETE",
      url: `/api/v1/labels/${label.id}`,
      headers: authHeader(owner.id),
    });
    expect(blockedDelete.statusCode).toBe(409);

    const unapply = await app.inject({
      method: "PATCH",
      url: `/api/v1/tickets/${ticket.id}`,
      headers: authHeader(owner.id),
      payload: { version: patchRes.json().data.version, labelIds: [] },
    });
    expect(unapply.statusCode).toBe(200);

    const allowedDelete = await app.inject({
      method: "DELETE",
      url: `/api/v1/labels/${label.id}`,
      headers: authHeader(owner.id),
    });
    expect(allowedDelete.statusCode).toBe(204);
  });
});

describe("sprints", () => {
  it("deleting a sprint falls its tickets back to unsprinted, not an error", async () => {
    const { owner, project } = await setupProject();

    const sprint = (
      await app.inject({
        method: "POST",
        url: `/api/v1/projects/${project.id}/sprints`,
        headers: authHeader(owner.id),
        payload: { name: "Sprint 1", startDate: "2026-01-01T00:00:00Z", endDate: "2026-01-14T00:00:00Z" },
      })
    ).json().data;

    const ticket = (
      await app.inject({
        method: "POST",
        url: `/api/v1/projects/${project.id}/tickets`,
        headers: authHeader(owner.id),
        payload: { title: "Sprint work" },
      })
    ).json().data;

    const patchRes = await app.inject({
      method: "PATCH",
      url: `/api/v1/tickets/${ticket.id}`,
      headers: authHeader(owner.id),
      payload: { version: ticket.version, sprintId: sprint.id },
    });
    expect(patchRes.json().data.sprintId).toBe(sprint.id);

    const deleteRes = await app.inject({
      method: "DELETE",
      url: `/api/v1/sprints/${sprint.id}`,
      headers: authHeader(owner.id),
    });
    expect(deleteRes.statusCode).toBe(204);

    const ticketAfter = await app.inject({
      method: "GET",
      url: `/api/v1/tickets/${ticket.id}`,
      headers: authHeader(owner.id),
    });
    expect(ticketAfter.statusCode).toBe(200);
    expect(ticketAfter.json().data.sprintId).toBeNull();
  });

  it("rejects a sprint with endDate before startDate (400)", async () => {
    const { owner, project } = await setupProject();
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project.id}/sprints`,
      headers: authHeader(owner.id),
      payload: { name: "Bad sprint", startDate: "2026-02-01T00:00:00Z", endDate: "2026-01-01T00:00:00Z" },
    });
    expect(res.statusCode).toBe(400);
  });
});
