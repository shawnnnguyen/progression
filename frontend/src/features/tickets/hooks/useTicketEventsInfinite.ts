import { useInfiniteQuery } from "@tanstack/react-query";
import { listTicketEvents } from "../api/ticketEventsApi";

export const TICKET_EVENTS_PAGE_LIMIT = 20;

export function useTicketEventsInfinite(ticketId: string | undefined) {
  return useInfiniteQuery({
    queryKey: ["tickets", ticketId, "events", "infinite"],
    queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
      listTicketEvents(ticketId!, pageParam, TICKET_EVENTS_PAGE_LIMIT),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!ticketId,
  });
}
