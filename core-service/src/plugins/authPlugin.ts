import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";
import { verifyAccessToken } from "../services/authService.js";
import { UnauthorizedError } from "../errors/index.js";
import { config } from "../config.js";
import type { Actor } from "../services/authz.js";

declare module "fastify" {
  interface FastifyRequest {
    actor: Actor;
  }
}

export default fp(async function authPlugin(app: FastifyInstance) {
  app.decorateRequest("actor", null);

  app.addHook("preHandler", async (request) => {
    const header = request.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw new UnauthorizedError("Missing bearer token");
    }
    const claims = verifyAccessToken(header.slice("Bearer ".length), config.jwt);
    if (!claims) throw new UnauthorizedError("Invalid or expired access token");

    request.actor = { userId: claims.userId, actorType: "user" };
  });
});
