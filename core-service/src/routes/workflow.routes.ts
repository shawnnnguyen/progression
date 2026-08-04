import type { FastifyInstance } from "fastify";
import * as workflowService from "../services/workflowService.js";
import { workflowDeps } from "../deps.js";

// v1 is read-only (§4) — v2 adds mutation endpoints for admin-editable workflows.
export default async function workflowRoutes(app: FastifyInstance) {
  app.get("/projects/:projectId/workflow-states", async (request, reply) => {
    const { projectId } = request.params as { projectId: string };
    const states = await workflowService.listWorkflowStates(request.actor, projectId, workflowDeps);
    return reply.send({ data: states, nextCursor: null });
  });

  app.get("/projects/:projectId/workflow-transitions", async (request, reply) => {
    const { projectId } = request.params as { projectId: string };
    const transitions = await workflowService.listWorkflowTransitions(request.actor, projectId, workflowDeps);
    return reply.send({ data: transitions, nextCursor: null });
  });
}
