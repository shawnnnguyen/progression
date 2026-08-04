import { ValidationError } from "../errors/index.js";

export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 200;

export function clampLimit(limit?: number | string): number {
  const parsed = typeof limit === "string" ? Number(limit) : limit;
  if (!parsed || !Number.isFinite(parsed)) return DEFAULT_PAGE_SIZE;
  return Math.min(Math.max(1, Math.floor(parsed)), MAX_PAGE_SIZE);
}

export function encodeCursor(createdAt: Date, id: string): string {
  return Buffer.from(`${createdAt.toISOString()}|${id}`, "utf8").toString("base64url");
}

export function decodeCursor(cursor: string): { createdAt: Date; id: string } {
  const decoded = Buffer.from(cursor, "base64url").toString("utf8");
  const sepIndex = decoded.lastIndexOf("|");
  const iso = decoded.slice(0, sepIndex);
  const id = decoded.slice(sepIndex + 1);
  const createdAt = new Date(iso);
  if (sepIndex < 0 || !id || Number.isNaN(createdAt.getTime())) {
    throw new ValidationError("Invalid pagination cursor");
  }
  return { createdAt, id };
}

export function cursorWhereDesc(cursor?: string | null): Record<string, unknown> | undefined {
  if (!cursor) return undefined;
  const { createdAt, id } = decodeCursor(cursor);
  return {
    OR: [{ createdAt: { lt: createdAt } }, { createdAt, id: { lt: id } }],
  };
}

export function buildPage<T extends { id: string; createdAt: Date }>(
  rows: T[],
  limit: number,
): { data: T[]; nextCursor: string | null } {
  if (rows.length > limit) {
    const data = rows.slice(0, limit);
    const last = data[data.length - 1]!;
    return { data, nextCursor: encodeCursor(last.createdAt, last.id) };
  }
  return { data: rows, nextCursor: null };
}
