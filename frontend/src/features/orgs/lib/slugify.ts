/** Mirrors core-service's `slugify` (orgs.routes.ts) so the live preview matches what the server would generate when no slug is supplied. */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
