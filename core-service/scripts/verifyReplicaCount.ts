import { config } from "../src/config.js";

export function verifyReplicaCount(): void {
  if (config.replicaCount > 1) {
    throw new Error(
      `core-service is configured for ${config.replicaCount} replicas, but the in-process ` +
        "event bus (§2) only supports exactly 1. Scale out requires swapping eventBus.ts for " +
        "Redis pub/sub first.",
    );
  }
}
