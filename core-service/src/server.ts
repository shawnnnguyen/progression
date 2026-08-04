import { buildApp } from "./app.js";
import { config } from "./config.js";
import { verifyReplicaCount } from "../scripts/verifyReplicaCount.js";

async function main() {
  verifyReplicaCount();

  const app = await buildApp();
  await app.listen({ port: config.port, host: config.host });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
