import Fastify, { type FastifyInstance } from "fastify";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import { registerErrorHandler } from "./errors/index.js";
import websocketPlugin from "./plugins/websocketPlugin.js";
import authPlugin from "./plugins/authPlugin.js";
import { config } from "./config.js";

import authRoutes, { meRoutes } from "./routes/auth.routes.js";
import orgsRoutes from "./routes/orgs.routes.js";
import projectsRoutes from "./routes/projects.routes.js";
import workflowRoutes from "./routes/workflow.routes.js";
import labelsRoutes from "./routes/labels.routes.js";
import sprintsRoutes from "./routes/sprints.routes.js";
import ticketsRoutes from "./routes/tickets.routes.js";
import wsRoutes from "./routes/ws.routes.js";

const API_PREFIX = "/api/v1";

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: process.env.NODE_ENV !== "test" });

  registerErrorHandler(app);
  await app.register(cors, { origin: config.webOrigin, credentials: true });
  await app.register(cookie);
  await app.register(websocketPlugin);

  await app.register(
    async (publicApp) => {
      publicApp.get("/health", async () => ({ data: { status: "ok" } }));
      await publicApp.register(authRoutes);
      await publicApp.register(wsRoutes);
    },
    { prefix: API_PREFIX },
  );

  await app.register(
    async (protectedApp) => {
      await protectedApp.register(authPlugin);
      await protectedApp.register(meRoutes);
      await protectedApp.register(orgsRoutes);
      await protectedApp.register(projectsRoutes);
      await protectedApp.register(workflowRoutes);
      await protectedApp.register(labelsRoutes);
      await protectedApp.register(sprintsRoutes);
      await protectedApp.register(ticketsRoutes);
    },
    { prefix: API_PREFIX },
  );

  return app;
}
