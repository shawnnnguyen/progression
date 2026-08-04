// Shared Fastify JSON-Schema fragments, reused across route files.

export const paginationQuerySchema = {
  type: "object",
  properties: {
    cursor: { type: "string" },
    limit: { type: "integer", minimum: 1, maximum: 200 },
  },
} as const;
