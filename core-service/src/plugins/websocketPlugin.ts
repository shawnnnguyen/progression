import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";
import websocket from "@fastify/websocket";

export default fp(async function websocketPlugin(app: FastifyInstance) {
  await app.register(websocket);
});
