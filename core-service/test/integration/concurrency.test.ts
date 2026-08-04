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

describe("concurrency: ticket numbering under contention", () => {
  it("20 parallel ticket creates in the same project get 20 distinct, gapless numbers", async () => {
    const owner = await createUser("Owner");
    const org = await createOrgWithOwner(owner.id, "Acme");
    const project = await createProjectFixture(org.id, owner.id, { key: "ENG" });

    const results = await Promise.all(
      Array.from({ length: 20 }, (_, i) =>
        app.inject({
          method: "POST",
          url: `/api/v1/projects/${project.id}/tickets`,
          headers: authHeader(owner.id),
          payload: { title: `Ticket ${i}` },
        }),
      ),
    );

    expect(results.every((r) => r.statusCode === 201)).toBe(true);
    const numbers = results.map((r) => r.json().data.number as number).sort((a, b) => a - b);
    expect(new Set(numbers).size).toBe(20);
    expect(numbers).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
  });
});

describe("concurrency: transition and patch races", () => {
  it("of two parallel transition calls against the same ticket, exactly one succeeds and the other gets 409 STALE_STATE", async () => {
    const owner = await createUser("Owner");
    const org = await createOrgWithOwner(owner.id, "Acme");
    const project = await createProjectFixture(org.id, owner.id, { key: "ENG" });

    const ticket = (
      await app.inject({
        method: "POST",
        url: `/api/v1/projects/${project.id}/tickets`,
        headers: authHeader(owner.id),
        payload: { title: "Race me" },
      })
    ).json().data;

    const statesRes = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${project.id}/workflow-states`,
      headers: authHeader(owner.id),
    });
    const inProgress = statesRes.json().data.find((s: { category: string }) => s.category === "INPROGRESS");

    const [a, b] = await Promise.all([
      app.inject({
        method: "POST",
        url: `/api/v1/tickets/${ticket.id}/transition`,
        headers: authHeader(owner.id),
        payload: { toStateId: inProgress.id, version: ticket.version },
      }),
      app.inject({
        method: "POST",
        url: `/api/v1/tickets/${ticket.id}/transition`,
        headers: authHeader(owner.id),
        payload: { toStateId: inProgress.id, version: ticket.version },
      }),
    ]);

    const statuses = [a.statusCode, b.statusCode].sort();
    expect(statuses).toEqual([200, 409]);
    const failed = a.statusCode === 409 ? a : b;
    expect(failed.json().error.code).toBe("STALE_STATE");
  });

  it("of two parallel PATCH calls against the same ticket, exactly one succeeds and the other gets 409 STALE_STATE", async () => {
    const owner = await createUser("Owner");
    const org = await createOrgWithOwner(owner.id, "Acme");
    const project = await createProjectFixture(org.id, owner.id, { key: "ENG" });

    const ticket = (
      await app.inject({
        method: "POST",
        url: `/api/v1/projects/${project.id}/tickets`,
        headers: authHeader(owner.id),
        payload: { title: "Race me" },
      })
    ).json().data;

    const [a, b] = await Promise.all([
      app.inject({
        method: "PATCH",
        url: `/api/v1/tickets/${ticket.id}`,
        headers: authHeader(owner.id),
        payload: { version: ticket.version, title: "Title from A" },
      }),
      app.inject({
        method: "PATCH",
        url: `/api/v1/tickets/${ticket.id}`,
        headers: authHeader(owner.id),
        payload: { version: ticket.version, title: "Title from B" },
      }),
    ]);

    const statuses = [a.statusCode, b.statusCode].sort();
    expect(statuses).toEqual([200, 409]);
    const failed = a.statusCode === 409 ? a : b;
    expect(failed.json().error.code).toBe("STALE_STATE");
  });
});
