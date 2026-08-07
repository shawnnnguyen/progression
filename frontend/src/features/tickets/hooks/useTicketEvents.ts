import { useQuery } from "@tanstack/react-query";
import { listTicketEvents } from "../api/ticketEventsApi";

export function useTicketEvents(ticketId: string | undefined) {
  return useQuery({
    queryKey: ["tickets", ticketId, "events"],
    queryFn: () => listTicketEvents(ticketId!).then((res) => res.data),
    enabled: !!ticketId,
  });
}
