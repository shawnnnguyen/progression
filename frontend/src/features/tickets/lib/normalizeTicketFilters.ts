import type { TicketFilters } from "../types";

/**
 * Strips undefined-valued filter properties before they land in a query key, so
 * board's call (no assignee/label/state) and list's call with equivalent filters
 * land on the same cache entry instead of fragmenting it.
 */
export function normalizeTicketFilters(filters: TicketFilters): TicketFilters {
  const normalized: TicketFilters = {};
  for (const [key, value] of Object.entries(filters) as [keyof TicketFilters, string | undefined][]) {
    if (value !== undefined) normalized[key] = value;
  }
  return normalized;
}
