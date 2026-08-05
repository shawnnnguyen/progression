import "dotenv/config";

// Environment parsing — the only place process.env is read directly.

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function parseDurationMs(value: string): number {
  const match = /^(\d+)(ms|s|m|h|d)$/.exec(value);
  if (!match) throw new Error(`Invalid duration: ${value}`);
  const amount = Number(match[1]);
  const unitMs: Record<string, number> = { ms: 1, s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return amount * unitMs[match[2]!]!;
}

export const config = {
  port: Number(process.env.PORT ?? 3000),
  host: process.env.HOST ?? "0.0.0.0",
  webOrigin: process.env.WEB_ORIGIN ?? "http://localhost:5173",
  databaseUrl: required("DATABASE_URL"),
  jwt: {
    accessSecret: required("JWT_ACCESS_SECRET"),
    accessTtlSeconds: Math.floor(parseDurationMs(process.env.ACCESS_TOKEN_TTL ?? "15m") / 1000),
    refreshTtlMs: parseDurationMs(process.env.REFRESH_TOKEN_TTL ?? "30d"),
  },
  replicaCount: Number(process.env.REPLICA_COUNT ?? 1),
};
