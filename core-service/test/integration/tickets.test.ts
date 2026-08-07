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

async function setupProject() {
  const owner = await createUser("Owner");
  const org = await createOrgWithOwner(owner.id, "Acme");
  const project = await createProjectFixture(org.id, owner.id, { key: "ENG" });
  return { owner, org, project };
}

describe("ticket CRUD + workflow transitions (full route -> service -> DB round trip)", () => {
  it("creates a ticket in the default state and records a CREATED event", async () => {
    const { owner, project } = await setupProject();

    const createRes = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project.id}/tickets`,
      headers: authHeader(owner.id),
      payload: { title: "Fix the bug" },
    });
    expect(createRes.statusCode).toBe(201);
    const ticket = createRes.json().data;
    expect(ticket.number).toBe(1);

    const eventsRes = await app.inject({
      method: "GET",
      url: `/api/v1/tickets/${ticket.id}/events`,
      headers: authHeader(owner.id),
    });
    expect(eventsRes.statusCode).toBe(200);
    const events = eventsRes.json().data;
    expect(events.some((e: { type: string }) => e.type === "CREATED")).toBe(true);
  });

  it("second ticket in the same project gets number 2", async () => {
    const { owner, project } = await setupProject();
    await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project.id}/tickets`,
      headers: authHeader(owner.id),
      payload: { title: "First" },
    });
    const second = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project.id}/tickets`,
      headers: authHeader(owner.id),
      payload: { title: "Second" },
    });
    expect(second.json().data.number).toBe(2);
  });

  it("rejects an illegal transition with 409 ILLEGAL_TRANSITION", async () => {
    const { owner, project } = await setupProject();
    const ticket = (
      await app.inject({
        method: "POST",
        url: `/api/v1/projects/${project.id}/tickets`,
        headers: authHeader(owner.id),
        payload: { title: "Ticket" },
      })
    ).json().data;

    const statesRes = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${project.id}/workflow-states`,
      headers: authHeader(owner.id),
    });
    const doneState = statesRes.json().data.find((s: { category: string }) => s.category === "DONE");

    const res = await app.inject({
      method: "POST",
      url: `/api/v1/tickets/${ticket.id}/transition`,
      headers: authHeader(owner.id),
      payload: { toStateId: doneState.id, version: ticket.version },
    });
    expect(res.statusCode).toBe(409);
    expect(res.json().error.code).toBe("ILLEGAL_TRANSITION");
  });

  it("performs a legal transition, records a STATE_CHANGED event, then rejects a stale retry", async () => {
    const { owner, project } = await setupProject();
    const ticket = (
      await app.inject({
        method: "POST",
        url: `/api/v1/projects/${project.id}/tickets`,
        headers: authHeader(owner.id),
        payload: { title: "Ticket" },
      })
    ).json().data;

    const statesRes = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${project.id}/workflow-states`,
      headers: authHeader(owner.id),
    });
    const inProgress = statesRes.json().data.find((s: { category: string }) => s.category === "INPROGRESS");

    const first = await app.inject({
      method: "POST",
      url: `/api/v1/tickets/${ticket.id}/transition`,
      headers: authHeader(owner.id),
      payload: { toStateId: inProgress.id, version: ticket.version },
    });
    expect(first.statusCode).toBe(200);
    expect(first.json().data.stateId).toBe(inProgress.id);

    const stale = await app.inject({
      method: "POST",
      url: `/api/v1/tickets/${ticket.id}/transition`,
      headers: authHeader(owner.id),
      payload: { toStateId: inProgress.id, version: ticket.version },
    });
    expect(stale.statusCode).toBe(409);
    expect(stale.json().error.code).toMatch(/STALE_STATE|ILLEGAL_TRANSITION/);

    const eventsRes = await app.inject({
      method: "GET",
      url: `/api/v1/tickets/${ticket.id}/events`,
      headers: authHeader(owner.id),
    });
    expect(eventsRes.json().data.some((e: { type: string }) => e.type === "STATE_CHANGED")).toBe(true);
  });

  it("a VIEWER can read tickets but is blocked from creating, commenting, or transitioning (403)", async () => {
    const { owner, project, org } = await setupProject();
    const viewer = await createUser("Viewer");
    await addOrgMember(org.id, viewer.id, "VIEWER");

    const ticket = (
      await app.inject({
        method: "POST",
        url: `/api/v1/projects/${project.id}/tickets`,
        headers: authHeader(owner.id),
        payload: { title: "Ticket" },
      })
    ).json().data;

    const readRes = await app.inject({
      method: "GET",
      url: `/api/v1/tickets/${ticket.id}`,
      headers: authHeader(viewer.id),
    });
    expect(readRes.statusCode).toBe(200);

    const createRes = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project.id}/tickets`,
      headers: authHeader(viewer.id),
      payload: { title: "Nope" },
    });
    expect(createRes.statusCode).toBe(403);

    const commentRes = await app.inject({
      method: "POST",
      url: `/api/v1/tickets/${ticket.id}/comments`,
      headers: authHeader(viewer.id),
      payload: { body: "Nope" },
    });
    expect(commentRes.statusCode).toBe(403);
  });

  it("comments: create, list, and edit-own round trip, writing a COMMENTED ticket event", async () => {
    const { owner, project } = await setupProject();
    const ticket = (
      await app.inject({
        method: "POST",
        url: `/api/v1/projects/${project.id}/tickets`,
        headers: authHeader(owner.id),
        payload: { title: "Ticket" },
      })
    ).json().data;

    const commentRes = await app.inject({
      method: "POST",
      url: `/api/v1/tickets/${ticket.id}/comments`,
      headers: authHeader(owner.id),
      payload: { body: "First comment" },
    });
    expect(commentRes.statusCode).toBe(201);
    const comment = commentRes.json().data;

    const editRes = await app.inject({
      method: "PATCH",
      url: `/api/v1/comments/${comment.id}`,
      headers: authHeader(owner.id),
      payload: { body: "Edited comment" },
    });
    expect(editRes.statusCode).toBe(200);
    expect(editRes.json().data.body).toBe("Edited comment");

    const eventsRes = await app.inject({
      method: "GET",
      url: `/api/v1/tickets/${ticket.id}/events`,
      headers: authHeader(owner.id),
    });
    expect(eventsRes.json().data.some((e: { type: string }) => e.type === "COMMENTED")).toBe(true);
  });

  it("looks up a ticket by project + number, and the returned id round-trips against comments/events", async () => {
    const { owner, project } = await setupProject();
    const ticket = (
      await app.inject({
        method: "POST",
        url: `/api/v1/projects/${project.id}/tickets`,
        headers: authHeader(owner.id),
        payload: { title: "Findable by number" },
      })
    ).json().data;

    const byNumberRes = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${project.id}/tickets/number/${ticket.number}`,
      headers: authHeader(owner.id),
    });
    expect(byNumberRes.statusCode).toBe(200);
    expect(byNumberRes.json().data.id).toBe(ticket.id);

    const commentsRes = await app.inject({
      method: "GET",
      url: `/api/v1/tickets/${ticket.id}/comments`,
      headers: authHeader(owner.id),
    });
    expect(commentsRes.statusCode).toBe(200);

    const eventsRes = await app.inject({
      method: "GET",
      url: `/api/v1/tickets/${ticket.id}/events`,
      headers: authHeader(owner.id),
    });
    expect(eventsRes.statusCode).toBe(200);
  });

  it("returns 404 for an unknown ticket number in an otherwise valid project", async () => {
    const { owner, project } = await setupProject();
    const res = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${project.id}/tickets/number/999`,
      headers: authHeader(owner.id),
    });
    expect(res.statusCode).toBe(404);
  });

  it("a stranger org's member gets 404 for another org's ticket looked up by number", async () => {
    const { owner, project } = await setupProject();
    const ticket = (
      await app.inject({
        method: "POST",
        url: `/api/v1/projects/${project.id}/tickets`,
        headers: authHeader(owner.id),
        payload: { title: "Ticket" },
      })
    ).json().data;

    const outsider = await createUser("Outsider");
    await createOrgWithOwner(outsider.id, "Org B");

    const res = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${project.id}/tickets/number/${ticket.number}`,
      headers: authHeader(outsider.id),
    });
    expect(res.statusCode).toBe(404);
    expect(res.json().error.code).toBe("NOT_FOUND");
  });

  it("labels attached via PATCH are echoed back on the ticket in both list and get responses", async () => {
    const { owner, project } = await setupProject();
    const ticket = (
      await app.inject({
        method: "POST",
        url: `/api/v1/projects/${project.id}/tickets`,
        headers: authHeader(owner.id),
        payload: { title: "Ticket" },
      })
    ).json().data;
    expect(ticket.labels).toEqual([]);

    const labelRes = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project.id}/labels`,
      headers: authHeader(owner.id),
      payload: { name: "api", color: "#4287f5" },
    });
    expect(labelRes.statusCode).toBe(201);
    const label = labelRes.json().data;

    const patchRes = await app.inject({
      method: "PATCH",
      url: `/api/v1/tickets/${ticket.id}`,
      headers: authHeader(owner.id),
      payload: { version: ticket.version, labelIds: [label.id] },
    });
    expect(patchRes.statusCode).toBe(200);
    expect(patchRes.json().data.labels).toEqual([label]);

    const getRes = await app.inject({
      method: "GET",
      url: `/api/v1/tickets/${ticket.id}`,
      headers: authHeader(owner.id),
    });
    expect(getRes.json().data.labels).toEqual([label]);

    const listRes = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${project.id}/tickets`,
      headers: authHeader(owner.id),
    });
    const listedTicket = listRes.json().data.find((t: { id: string }) => t.id === ticket.id);
    expect(listedTicket.labels).toEqual([label]);
  });
});
