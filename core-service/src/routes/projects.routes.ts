import type { FastifyInstance } from "fastify";
import * as projectService from "../services/projectService.js";
import { projectDeps } from "../deps.js";

export default async function projectsRoutes(app: FastifyInstance) {
  app.post(
    "/orgs/:orgId/projects",
    {
      schema: {
        body: {
          type: "object",
          required: ["key", "name"],
          properties: {
            key: { type: "string", minLength: 2, maxLength: 10 },
            name: { type: "string", minLength: 1, maxLength: 200 },
            description: { type: "string" },
            visibility: { type: "string", enum: ["ORG", "PRIVATE"] },
          },
        },
      },
    },
    async (request, reply) => {
      const { orgId } = request.params as { orgId: string };
      const input = request.body as projectService.CreateProjectInput;
      const project = await projectService.createProject(request.actor, orgId, input, projectDeps);
      return reply.code(201).send({ data: project });
    },
  );

  app.get("/orgs/:orgId/projects", async (request, reply) => {
    const { orgId } = request.params as { orgId: string };
    const projects = await projectService.listProjects(request.actor, orgId, projectDeps);
    return reply.send({ data: projects, nextCursor: null });
  });

  app.get("/projects/:projectId", async (request, reply) => {
    const { projectId } = request.params as { projectId: string };
    const project = await projectService.getProject(request.actor, projectId, projectDeps);
    return reply.send({ data: project });
  });

  app.patch(
    "/projects/:projectId",
    {
      schema: {
        body: {
          type: "object",
          properties: {
            name: { type: "string", minLength: 1, maxLength: 200 },
            description: { type: "string" },
            visibility: { type: "string", enum: ["ORG", "PRIVATE"] },
            archive: { type: "boolean" },
          },
        },
      },
    },
    async (request, reply) => {
      const { projectId } = request.params as { projectId: string };
      const { archive, ...patch } = request.body as projectService.UpdateProjectInput & { archive?: boolean };
      const project = archive
        ? await projectService.archiveProject(request.actor, projectId, projectDeps)
        : await projectService.updateProject(request.actor, projectId, patch, projectDeps);
      return reply.send({ data: project });
    },
  );

  app.get("/projects/:projectId/members", async (request, reply) => {
    const { projectId } = request.params as { projectId: string };
    const members = await projectService.listProjectMembers(request.actor, projectId, projectDeps);
    return reply.send({ data: members, nextCursor: null });
  });

  app.put(
    "/projects/:projectId/members/:userId",
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
      const { projectId, userId } = request.params as { projectId: string; userId: string };
      const { role } = request.body as { role: "ADMIN" | "MEMBER" | "VIEWER" };
      const override = await projectService.setProjectMemberOverride(request.actor, projectId, userId, role, projectDeps);
      return reply.send({ data: override });
    },
  );

  app.delete("/projects/:projectId/members/:userId", async (request, reply) => {
    const { projectId, userId } = request.params as { projectId: string; userId: string };
    await projectService.removeProjectMemberOverride(request.actor, projectId, userId, projectDeps);
    return reply.code(204).send();
  });
}
