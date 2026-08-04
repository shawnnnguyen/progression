module.exports = {
  forbidden: [
    {
      name: "routes-no-prisma",
      comment: "Route layer must not import Prisma directly — bypasses the single-write-path guarantee (§2).",
      severity: "error",
      from: { path: "^src/routes" },
      to: { path: "^(node_modules/)?@prisma/client" },
    },
    {
      name: "routes-no-repositories",
      comment: "Route layer must call domain services, never repositories, directly.",
      severity: "error",
      from: { path: "^src/routes" },
      to: { path: "^src/repositories" },
    },
    {
      name: "domain-no-fastify",
      comment: "Domain layer must stay unit-testable with zero HTTP (§6) — no Fastify imports.",
      severity: "error",
      from: { path: "^src/domain" },
      to: { path: "^(node_modules/)?fastify" },
    },
    {
      name: "domain-no-prisma",
      comment: "Domain layer must depend on repository interfaces, not concrete Prisma repositories.",
      severity: "error",
      from: { path: "^src/domain" },
      to: { path: "^(node_modules/)?@prisma/client" },
    },
    {
      name: "only-repositories-import-prisma",
      comment: "Only src/repositories/** may import @prisma/client.",
      severity: "error",
      from: { path: "^src/(?!repositories)" },
      to: { path: "^(node_modules/)?@prisma/client" },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: "tsconfig.json" },
  },
};
