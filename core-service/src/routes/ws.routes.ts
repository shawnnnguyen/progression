import type { FastifyInstance } from "fastify";
import type { WebSocket } from "@fastify/websocket";
import { verifyAccessToken } from "../services/authService.js";
import { resolveProjectRole, type Actor } from "../services/authz.js";
import { eventBus, authzRepository } from "../deps.js";
import { config } from "../config.js";

const FIRST_FRAME_TIMEOUT_MS = 5000;

type ClientMessage =
  | { action: "auth"; token: string }
  | { action: "subscribe"; projectId: string }
  | { action: "unsubscribe"; projectId: string };

function send(socket: WebSocket, payload: object) {
  socket.send(JSON.stringify(payload));
}

// Connect unauthenticated at the TCP/HTTP-upgrade level — no token in the
// URL, so it never lands in proxy/load-balancer access logs (§2). The first
// frame must be `{ action: "auth", token }` within 5s or the connection is
// closed.
export default async function wsRoutes(app: FastifyInstance) {
  app.get("/ws", { websocket: true }, (socket) => {
    let actor: Actor | null = null;
    const subscribedProjects = new Set<string>();

    const authTimeout = setTimeout(() => {
      if (!actor) socket.close(4001, "Auth frame not received within timeout");
    }, FIRST_FRAME_TIMEOUT_MS);

    const unsubscribeFromBus = eventBus.subscribe((event) => {
      if (subscribedProjects.has(event.projectId)) {
        send(socket, event);
      }
    });

    socket.on("message", (raw: Buffer) => {
      void (async () => {
        let message: ClientMessage;
        try {
          message = JSON.parse(raw.toString());
        } catch {
          return send(socket, { error: "Invalid JSON" });
        }

        if (message.action === "auth") {
          const claims = verifyAccessToken(message.token, config.jwt);
          if (!claims) return send(socket, { error: "Invalid or expired token" });
          clearTimeout(authTimeout);
          actor = { userId: claims.userId, actorType: "user" };
          return send(socket, { authenticated: true });
        }

        if (!actor) {
          return send(socket, { error: "Not authenticated" });
        }

        if (message.action === "subscribe") {
          // Same effective-project-role resolution used everywhere else
          // (§2) — a connection with no read access to the project is
          // rejected at the subscribe step, not allowed to join the room.
          const role = await resolveProjectRole(authzRepository, actor, message.projectId);
          if (!role) return send(socket, { error: "NOT_FOUND", projectId: message.projectId });
          subscribedProjects.add(message.projectId);
          return send(socket, { subscribed: message.projectId });
        }

        if (message.action === "unsubscribe") {
          subscribedProjects.delete(message.projectId);
          return send(socket, { unsubscribed: message.projectId });
        }
      })();
    });

    socket.on("close", () => {
      clearTimeout(authTimeout);
      unsubscribeFromBus();
    });
  });
}
