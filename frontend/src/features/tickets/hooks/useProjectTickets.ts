import { useQuery } from "@tanstack/react-query";
import { listProjectTickets } from "../api/ticketsApi";
import { normalizeTicketFilters } from "../lib/normalizeTicketFilters";
import { fetchAllPages, TICKETS_PAGE_LIMIT } from "../lib/fetchAllPages";
import type { TicketFilters } from "../types";

export function useProjectTickets(projectId: string | undefined, filters: TicketFilters) {
  const normalizedFilters = normalizeTicketFilters(filters);

  return useQuery({
    queryKey: ["projects", projectId, "tickets", normalizedFilters],
    queryFn: () =>
      fetchAllPages((cursor) => listProjectTickets(projectId!, normalizedFilters, cursor, TICKETS_PAGE_LIMIT)),
    enabled: !!projectId,
  });
}
