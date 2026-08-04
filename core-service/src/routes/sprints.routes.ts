import type { FastifyInstance } from "fastify";
import * as sprintService from "../services/sprintService.js";
import { sprintDeps } from "../deps.js";
import { paginationQuerySchema } from "../schemas/common.schema.js";

const dateBody = { type: "string", format: "date-time" } as const;

export default async function sprintsRoutes(app: FastifyInstance) {
  app.post(
    "/projects/:projectId/sprints",
    {
      schema: {
        body: {
          type: "object",
          required: ["name", "startDate", "endDate"],
          properties: {
            name: { type: "string", minLength: 1, maxLength: 200 },
            goal: { type: "string" },
            startDate: dateBody,
            endDate: dateBody,
          },
        },
      },
    },
    async (request, reply) => {
      const { projectId } = request.params as { projectId: string };
      const body = request.body as { name: string; goal?: string; startDate: string; endDate: string };
      const sprint = await sprintService.createSprint(
        request.actor,
        projectId,
        { name: body.name, goal: body.goal, startDate: new Date(body.startDate), endDate: new Date(body.endDate) },
        sprintDeps,
      );
      return reply.code(201).send({ data: sprint });
    },
  );

  app.get("/projects/:projectId/sprints", async (request, reply) => {
    const { projectId } = request.params as { projectId: string };
    const sprints = await sprintService.listSprints(request.actor, projectId, sprintDeps);
    return reply.send({ data: sprints, nextCursor: null });
  });

  app.get(
    "/sprints/:sprintId",
    { schema: { querystring: paginationQuerySchema } },
    async (request, reply) => {
      const { sprintId } = request.params as { sprintId: string };
      const query = request.query as { cursor?: string; limit?: number };
      const result = await sprintService.getSprint(request.actor, sprintId, sprintDeps, query.cursor, query.limit);
      return reply.send({ data: result.sprint, tickets: result.tickets });
    },
  );

  app.patch(
    "/sprints/:sprintId",
    {
      schema: {
        body: {
          type: "object",
          properties: {
            name: { type: "string", minLength: 1, maxLength: 200 },
            goal: { type: "string" },
            startDate: dateBody,
            endDate: dateBody,
            status: { type: "string", enum: ["PLANNED", "ACTIVE", "COMPLETED"] },
          },
        },
      },
    },
    async (request, reply) => {
      const { sprintId } = request.params as { sprintId: string };
      const body = request.body as {
        name?: string;
        goal?: string;
        startDate?: string;
        endDate?: string;
        status?: "PLANNED" | "ACTIVE" | "COMPLETED";
      };
      const patch: sprintService.UpdateSprintInput = {
        ...body,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
      };
      const sprint = await sprintService.updateSprint(request.actor, sprintId, patch, sprintDeps);
      return reply.send({ data: sprint });
    },
  );

  app.delete("/sprints/:sprintId", async (request, reply) => {
    const { sprintId } = request.params as { sprintId: string };
    await sprintService.deleteSprint(request.actor, sprintId, sprintDeps);
    return reply.code(204).send();
  });
}
