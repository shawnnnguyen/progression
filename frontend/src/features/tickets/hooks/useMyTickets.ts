import { useQuery } from "@tanstack/react-query";
import { listMyTickets } from "../api/ticketsApi";
import { fetchAllPages, TICKETS_PAGE_LIMIT } from "../lib/fetchAllPages";

export function useMyTickets() {
  return useQuery({
    queryKey: ["me", "tickets"],
    queryFn: () => fetchAllPages((cursor) => listMyTickets(cursor, TICKETS_PAGE_LIMIT)),
  });
}
