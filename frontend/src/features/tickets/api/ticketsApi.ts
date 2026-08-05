import { apiFetch } from "@/lib/api";
import type { TicketFilters, TicketRow, TicketsPage } from "../types";

function buildQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export function listMyTickets(cursor?: string, limit?: number) {
  return apiFetch<TicketsPage>(`/me/tickets${buildQuery({ cursor, limit })}`);
}

export function listProjectTickets(
  projectId: string,
  filters: TicketFilters,
  cursor?: string,
  limit?: number,
) {
  return apiFetch<TicketsPage>(
    `/projects/${projectId}/tickets${buildQuery({ ...filters, cursor, limit })}`,
  );
}

export function transitionTicket(ticketId: string, input: { toStateId: string; version: number }) {
  return apiFetch<{ data: TicketRow }>(`/tickets/${ticketId}/transition`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}
