import type { FastifyInstance } from "fastify";
import * as membershipService from "../services/membershipService.js";
import { membershipDeps } from "../deps.js";
import { paginationQuerySchema } from "../schemas/common.schema.js";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default async function orgsRoutes(app: FastifyInstance) {
  app.post(
    "/orgs",
    {
      schema: {
        body: {
          type: "object",
          required: ["name"],
          properties: { name: { type: "string", minLength: 1, maxLength: 200 }, slug: { type: "string" } },
        },
      },
    },
    async (request, reply) => {
      const { name, slug } = request.body as { name: string; slug?: string };
      const org = await membershipService.createOrg(request.actor, name, slug ?? slugify(name), membershipDeps);
      return reply.code(201).send({ data: org });
    },
  );

  app.get("/orgs", async (request, reply) => {
    const orgs = await membershipService.listMyOrgs(request.actor, membershipDeps);
    return reply.send({ data: orgs, nextCursor: null });
  });

  app.get("/orgs/:orgId", async (request, reply) => {
    const { orgId } = request.params as { orgId: string };
    const org = await membershipService.getOrg(request.actor, orgId, membershipDeps);
    return reply.send({ data: org });
  });

  app.patch(
    "/orgs/:orgId",
    {
      schema: { body: { type: "object", properties: { name: { type: "string", minLength: 1, maxLength: 200 } } } },
    },
    async (request, reply) => {
      const { orgId } = request.params as { orgId: string };
      const patch = request.body as { name?: string };
      const org = await membershipService.updateOrg(request.actor, orgId, patch, membershipDeps);
      return reply.send({ data: org });
    },
  );

  app.post(
    "/orgs/:orgId/invites",
    {
      schema: {
        body: {
          type: "object",
          required: ["email", "role"],
          properties: {
            email: { type: "string", format: "email" },
            role: { type: "string", enum: ["ADMIN", "MEMBER", "VIEWER"] },
          },
        },
      },
    },
    async (request, reply) => {
      const { orgId } = request.params as { orgId: string };
      const { email, role } = request.body as { email: string; role: "ADMIN" | "MEMBER" | "VIEWER" };
      const { invite, plaintextToken } = await membershipService.inviteMember(request.actor, orgId, email, role, membershipDeps);
      return reply.code(201).send({ data: { invite, token: plaintextToken } });
    },
  );

  app.get("/orgs/:orgId/invites", async (request, reply) => {
    const { orgId } = request.params as { orgId: string };
    const invites = await membershipService.listInvites(request.actor, orgId, membershipDeps);
    return reply.send({ data: invites, nextCursor: null });
  });

  app.delete("/orgs/:orgId/invites/:inviteId", async (request, reply) => {
    const { orgId, inviteId } = request.params as { orgId: string; inviteId: string };
    await membershipService.revokeInvite(request.actor, orgId, inviteId, membershipDeps);
    return reply.code(204).send();
  });

  app.post(
    "/invites/:inviteId/accept",
    {
      schema: {
        body: { type: "object", required: ["token"], properties: { token: { type: "string", minLength: 1 } } },
      },
    },
    async (request, reply) => {
      const { inviteId } = request.params as { inviteId: string };
      const { token } = request.body as { token: string };
      const membership = await membershipService.acceptInvite(request.actor, inviteId, token, membershipDeps);
      return reply.send({ data: membership });
    },
  );

  app.get("/orgs/:orgId/members", async (request, reply) => {
    const { orgId } = request.params as { orgId: string };
    const members = await membershipService.listOrgMembers(request.actor, orgId, membershipDeps);
    return reply.send({ data: members, nextCursor: null });
  });

  app.get(
    "/orgs/:orgId/audit-events",
    { schema: { querystring: paginationQuerySchema } },
    async (request, reply) => {
      const { orgId } = request.params as { orgId: string };
      const query = request.query as { cursor?: string; limit?: number };
      const page = await membershipService.listAuditEvents(request.actor, orgId, membershipDeps, query.cursor, query.limit);
      return reply.send(page);
    },
  );

  app.patch(
    "/orgs/:orgId/members/:userId",
    {
      schema: {
        body: {
          type: "object",
          required: ["role"],
          properties: { role: { type: "string", enum: ["ADMIN", "MEMBER", "VIEWER"] } },
        },
      },
    },
    async (request, reply) => {
      const { orgId, userId } = request.params as { orgId: string; userId: string };
      const { role } = request.body as { role: "ADMIN" | "MEMBER" | "VIEWER" };
      const membership = await membershipService.changeOrgRole(request.actor, orgId, userId, role, membershipDeps);
      return reply.send({ data: membership });
    },
  );

  app.delete("/orgs/:orgId/members/:userId", async (request, reply) => {
    const { orgId, userId } = request.params as { orgId: string; userId: string };
    await membershipService.removeOrgMember(request.actor, orgId, userId, membershipDeps);
    return reply.code(204).send();
  });
}
