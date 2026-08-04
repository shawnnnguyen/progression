import { afterAll, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import WebSocket from "ws";
import { buildApp } from "../../src/app.js";
import { resetDatabase, disconnectDatabase } from "../fixtures/db.js";
import { authHeader, createOrgWithOwner, createProjectFixture, createUser, signAccessToken } from "../fixtures/factories.js";

let app: FastifyInstance;
let baseWsUrl: string;

beforeEach(async () => {
  await resetDatabase();
  app = await buildApp();
  await app.listen({ port: 0, host: "127.0.0.1" });
  const address = app.server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  baseWsUrl = `ws://127.0.0.1:${port}/api/v1/ws`;
});

afterAll(async () => {
  await app?.close();
  await disconnectDatabase();
});

function waitForMessage(socket: WebSocket, predicate: (msg: any) => boolean, timeoutMs = 5000): Promise<any> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Timed out waiting for WS message")), timeoutMs);
    socket.on("message", (raw) => {
      const msg = JSON.parse(raw.toString());
      if (predicate(msg)) {
        clearTimeout(timer);
        resolve(msg);
      }
    });
  });
}

function openSocket(url: string): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(url);
    socket.once("open", () => resolve(socket));
    socket.once("error", reject);
  });
}

describe("WebSocket real-time layer", () => {
  it("authenticates via first-frame handshake, subscribes, and receives a broadcast after a REST mutation", async () => {
    const owner = await createUser("Owner");
    const org = await createOrgWithOwner(owner.id, "Acme");
    const project = await createProjectFixture(org.id, owner.id, { key: "ENG" });

    const socket = await openSocket(baseWsUrl);
    socket.send(JSON.stringify({ action: "auth", token: signAccessToken(owner.id) }));
    await waitForMessage(socket, (m) => m.authenticated === true);

    socket.send(JSON.stringify({ action: "subscribe", projectId: project.id }));
    await waitForMessage(socket, (m) => m.subscribed === project.id);

    const broadcastPromise = waitForMessage(socket, (m) => m.event === "ticket.created");

    const createRes = await app.inject({
      method: "POST",
      url: `/api/v1/projects/${project.id}/tickets`,
      headers: authHeader(owner.id),
      payload: { title: "Broadcast me" },
    });
    expect(createRes.statusCode).toBe(201);

    const broadcast = await broadcastPromise;
    expect(broadcast.projectId).toBe(project.id);
    expect(typeof broadcast.seq).toBe("number");

    socket.close();
  });

  it("rejects a subscribe attempt for a project the connection has no access to", async () => {
    const owner = await createUser("Owner");
    const org = await createOrgWithOwner(owner.id, "Acme");
    const project = await createProjectFixture(org.id, owner.id, { key: "ENG" });

    const outsider = await createUser("Outsider");
    await createOrgWithOwner(outsider.id, "Org B");

    const socket = await openSocket(baseWsUrl);
    socket.send(JSON.stringify({ action: "auth", token: signAccessToken(outsider.id) }));
    await waitForMessage(socket, (m) => m.authenticated === true);

    socket.send(JSON.stringify({ action: "subscribe", projectId: project.id }));
    const rejection = await waitForMessage(socket, (m) => m.error === "NOT_FOUND");
    expect(rejection.projectId).toBe(project.id);

    socket.close();
  });

  it("closes the connection if no auth frame arrives within the timeout", async () => {
    // This test uses the real 5s timeout constant, so it's slower than the
    // rest of the suite but exercises the actual documented behavior (§2)
    // rather than a mocked clock.
    const socket = await openSocket(baseWsUrl);
    const closeCode = await new Promise<number>((resolve) => {
      socket.once("close", (code) => resolve(code));
    });
    expect(closeCode).toBe(4001);
  }, 10000);
});
