import { apiFetch } from "@/lib/api";
import type { TicketEventsPage } from "../types";

function buildQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export function listTicketEvents(ticketId: string, cursor?: string, limit?: number) {
  return apiFetch<TicketEventsPage>(`/tickets/${ticketId}/events${buildQuery({ cursor, limit })}`);
}
