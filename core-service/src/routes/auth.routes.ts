import type { FastifyInstance } from "fastify";
import * as authService from "../services/authService.js";
import { deactivateOtherUser } from "../services/membershipService.js";
import { authDeps, membershipDeps } from "../deps.js";
import { ForbiddenError, UnauthorizedError } from "../errors/index.js";
import { config } from "../config.js";

const REFRESH_COOKIE = "refreshToken";
const REFRESH_COOKIE_OPTS = {
  httpOnly: true,
  secure: true,
  sameSite: "strict" as const,
  path: "/api/v1/auth",
};

export default async function authRoutes(app: FastifyInstance) {
  app.post(
    "/auth/register",
    {
      schema: {
        body: {
          type: "object",
          required: ["email", "name", "password"],
          properties: {
            email: { type: "string", format: "email" },
            name: { type: "string", minLength: 1, maxLength: 200 },
            password: { type: "string", minLength: 8, maxLength: 200 },
          },
        },
      },
    },
    async (request, reply) => {
      const { email, name, password } = request.body as { email: string; name: string; password: string };
      const user = await authService.register({ email, name, password }, authDeps);
      return reply.code(201).send({ data: user });
    },
  );

  app.post(
    "/auth/login",
    {
      schema: {
        body: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      const { email, password } = request.body as { email: string; password: string };
      const { user, accessToken, refreshToken } = await authService.login(email, password, authDeps);
      reply.setCookie(REFRESH_COOKIE, refreshToken, { ...REFRESH_COOKIE_OPTS, maxAge: config.jwt.refreshTtlMs / 1000 });
      return reply.send({ data: { user, accessToken } });
    },
  );

  app.post("/auth/refresh", async (request, reply) => {
    const refreshToken = request.cookies[REFRESH_COOKIE];
    if (!refreshToken) throw new UnauthorizedError("No refresh token cookie present");
    const result = await authService.refreshAccessToken(refreshToken, authDeps);
    reply.setCookie(REFRESH_COOKIE, result.refreshToken, {
      ...REFRESH_COOKIE_OPTS,
      maxAge: config.jwt.refreshTtlMs / 1000,
    });
    return reply.send({ data: { accessToken: result.accessToken } });
  });

  app.post("/auth/logout", async (request, reply) => {
    const refreshToken = request.cookies[REFRESH_COOKIE];
    if (refreshToken) await authService.logout(refreshToken, authDeps);
    reply.clearCookie(REFRESH_COOKIE, { path: REFRESH_COOKIE_OPTS.path });
    return reply.code(204).send();
  });
}

export async function meRoutes(app: FastifyInstance) {
  app.get("/me", async (request, reply) => {
    const user = await authService.getCurrentUser(request.actor.userId, authDeps);
    return reply.send({ data: user });
  });

  app.post("/me/deactivate", async (request, reply) => {
    await authService.deactivateSelf(request.actor.userId, authDeps);
    return reply.code(204).send();
  });

  app.post("/users/:userId/deactivate", async (request, reply) => {
    const { userId } = request.params as { userId: string };
    if (userId === request.actor.userId) {
      throw new ForbiddenError("Use POST /me/deactivate to deactivate your own account");
    }
    await deactivateOtherUser(request.actor, userId, membershipDeps);
    return reply.code(204).send();
  });
}
