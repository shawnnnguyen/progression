import type { FastifyInstance } from "fastify";
import * as ticketService from "../services/ticketService.js";
import * as commentService from "../services/commentService.js";
import { ticketDeps, commentDeps } from "../deps.js";
import { paginationQuerySchema } from "../schemas/common.schema.js";

const PRIORITY_ENUM = ["NONE", "LOW", "MEDIUM", "HIGH", "URGENT"] as const;

export default async function ticketsRoutes(app: FastifyInstance) {
  app.post(
    "/projects/:projectId/tickets",
    {
      schema: {
        body: {
          type: "object",
          required: ["title"],
          properties: {
            title: { type: "string", minLength: 1, maxLength: 500 },
            description: { type: ["string", "null"] },
            priority: { type: "string", enum: PRIORITY_ENUM },
            stateId: { type: "string" },
            assigneeId: { type: ["string", "null"] },
            sprintId: { type: ["string", "null"] },
            labelIds: { type: "array", items: { type: "string" } },
          },
        },
      },
    },
    async (request, reply) => {
      const { projectId } = request.params as { projectId: string };
      const body = request.body as Omit<ticketService.CreateTicketInput, "projectId">;
      const ticket = await ticketService.createTicket(request.actor, { ...body, projectId }, ticketDeps);
      return reply.code(201).send({ data: ticket });
    },
  );

  app.get(
    "/projects/:projectId/tickets",
    {
      schema: {
        querystring: {
          type: "object",
          properties: {
            state: { type: "string" },
            assignee: { type: "string" },
            label: { type: "string" },
            sprint: { type: "string" },
            q: { type: "string" },
            updatedSince: { type: "string", format: "date-time" },
            cursor: { type: "string" },
            limit: { type: "integer", minimum: 1, maximum: 200 },
          },
        },
      },
    },
    async (request, reply) => {
      const { projectId } = request.params as { projectId: string };
      const query = request.query as {
        state?: string;
        assignee?: string;
        label?: string;
        sprint?: string;
        q?: string;
        updatedSince?: string;
        cursor?: string;
        limit?: number;
      };
      const page = await ticketService.listTickets(
        request.actor,
        projectId,
        {
          stateId: query.state,
          assigneeId: query.assignee,
          labelId: query.label,
          sprintId: query.sprint,
          q: query.q,
          updatedSince: query.updatedSince ? new Date(query.updatedSince) : undefined,
          cursor: query.cursor,
          limit: query.limit,
        },
        ticketDeps,
      );
      return reply.send(page);
    },
  );

  app.get("/me/tickets", { schema: { querystring: paginationQuerySchema } }, async (request, reply) => {
    const query = request.query as { cursor?: string; limit?: number };
    const page = await ticketService.listMyTickets(request.actor, ticketDeps, query.cursor, query.limit);
    return reply.send(page);
  });

  app.get("/tickets/:ticketId", async (request, reply) => {
    const { ticketId } = request.params as { ticketId: string };
    const ticket = await ticketService.getTicket(request.actor, ticketId, ticketDeps);
    return reply.send({ data: ticket });
  });

  app.get(
    "/projects/:projectId/tickets/number/:number",
    {
      schema: {
        params: {
          type: "object",
          required: ["projectId", "number"],
          properties: {
            projectId: { type: "string" },
            number: { type: "integer", minimum: 1 },
          },
        },
      },
    },
    async (request, reply) => {
      const { projectId, number } = request.params as { projectId: string; number: number };
      const ticket = await ticketService.getTicketByNumber(request.actor, projectId, number, ticketDeps);
      return reply.send({ data: ticket });
    },
  );

  app.patch(
    "/tickets/:ticketId",
    {
      schema: {
        body: {
          type: "object",
          required: ["version"],
          properties: {
            version: { type: "integer", minimum: 0 },
            title: { type: "string", minLength: 1, maxLength: 500 },
            description: { type: ["string", "null"] },
            priority: { type: "string", enum: PRIORITY_ENUM },
            assigneeId: { type: ["string", "null"] },
            sprintId: { type: ["string", "null"] },
            labelIds: { type: "array", items: { type: "string" } },
          },
        },
      },
    },
    async (request, reply) => {
      const { ticketId } = request.params as { ticketId: string };
      const patch = request.body as ticketService.TicketPatchInput;
      const ticket = await ticketService.updateTicket(request.actor, ticketId, patch, ticketDeps);
      return reply.send({ data: ticket });
    },
  );

  app.post(
    "/tickets/:ticketId/transition",
    {
      schema: {
        body: {
          type: "object",
          required: ["toStateId", "version"],
          properties: {
            toStateId: { type: "string" },
            version: { type: "integer", minimum: 0 },
          },
        },
      },
    },
    async (request, reply) => {
      const { ticketId } = request.params as { ticketId: string };
      const input = request.body as ticketService.TransitionInput;
      const ticket = await ticketService.transitionTicket(request.actor, ticketId, input, ticketDeps);
      return reply.send({ data: ticket });
    },
  );

  app.get(
    "/tickets/:ticketId/events",
    { schema: { querystring: paginationQuerySchema } },
    async (request, reply) => {
      const { ticketId } = request.params as { ticketId: string };
      const query = request.query as { cursor?: string; limit?: number };
      const page = await ticketService.listTicketEvents(request.actor, ticketId, ticketDeps, query.cursor, query.limit);
      return reply.send(page);
    },
  );

  app.post(
    "/tickets/:ticketId/comments",
    {
      schema: {
        body: { type: "object", required: ["body"], properties: { body: { type: "string", minLength: 1, maxLength: 10000 } } },
      },
    },
    async (request, reply) => {
      const { ticketId } = request.params as { ticketId: string };
      const { body } = request.body as { body: string };
      const comment = await commentService.createComment(request.actor, ticketId, body, commentDeps);
      return reply.code(201).send({ data: comment });
    },
  );

  app.get(
    "/tickets/:ticketId/comments",
    { schema: { querystring: paginationQuerySchema } },
    async (request, reply) => {
      const { ticketId } = request.params as { ticketId: string };
      const query = request.query as { cursor?: string; limit?: number };
      const page = await commentService.listComments(request.actor, ticketId, commentDeps, query.cursor, query.limit);
      return reply.send(page);
    },
  );

  app.patch(
    "/comments/:commentId",
    {
      schema: {
        body: { type: "object", required: ["body"], properties: { body: { type: "string", minLength: 1, maxLength: 10000 } } },
      },
    },
    async (request, reply) => {
      const { commentId } = request.params as { commentId: string };
      const { body } = request.body as { body: string };
      const comment = await commentService.updateComment(request.actor, commentId, body, commentDeps);
      return reply.send({ data: comment });
    },
  );

  app.delete("/comments/:commentId", async (request, reply) => {
    const { commentId } = request.params as { commentId: string };
    await commentService.deleteComment(request.actor, commentId, commentDeps);
    return reply.code(204).send();
  });
}
