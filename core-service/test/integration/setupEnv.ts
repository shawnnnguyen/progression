import dotenv from "dotenv";

dotenv.config();

// Integration tests must never run against the dev database — point
// DATABASE_URL at TEST_DATABASE_URL before any other module (in particular
// src/repositories/prismaClient.ts) is imported and captures it.
if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}
