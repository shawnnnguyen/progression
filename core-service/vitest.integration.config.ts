import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/integration/**/*.test.ts"],
    setupFiles: ["test/integration/setupEnv.ts"],
    testTimeout: 30000,
    hookTimeout: 30000,
    env: { NODE_ENV: "test" },
  },
});
