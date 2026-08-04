import type { FastifyInstance } from "fastify";
import * as labelService from "../services/labelService.js";
import { labelDeps } from "../deps.js";

export default async function labelsRoutes(app: FastifyInstance) {
  app.post(
    "/projects/:projectId/labels",
    {
      schema: {
        body: {
          type: "object",
          required: ["name", "color"],
          properties: {
            name: { type: "string", minLength: 1, maxLength: 100 },
            color: { type: "string", pattern: "^#[0-9a-fA-F]{6}$" },
          },
        },
      },
    },
    async (request, reply) => {
      const { projectId } = request.params as { projectId: string };
      const input = request.body as { name: string; color: string };
      const label = await labelService.createLabel(request.actor, projectId, input, labelDeps);
      return reply.code(201).send({ data: label });
    },
  );

  app.get("/projects/:projectId/labels", async (request, reply) => {
    const { projectId } = request.params as { projectId: string };
    const labels = await labelService.listLabels(request.actor, projectId, labelDeps);
    return reply.send({ data: labels, nextCursor: null });
  });

  app.patch(
    "/labels/:labelId",
    {
      schema: {
        body: {
          type: "object",
          properties: {
            name: { type: "string", minLength: 1, maxLength: 100 },
            color: { type: "string", pattern: "^#[0-9a-fA-F]{6}$" },
          },
        },
      },
    },
    async (request, reply) => {
      const { labelId } = request.params as { labelId: string };
      const patch = request.body as { name?: string; color?: string };
      const label = await labelService.updateLabel(request.actor, labelId, patch, labelDeps);
      return reply.send({ data: label });
    },
  );

  app.delete("/labels/:labelId", async (request, reply) => {
    const { labelId } = request.params as { labelId: string };
    await labelService.deleteLabel(request.actor, labelId, labelDeps);
    return reply.code(204).send();
  });
}
