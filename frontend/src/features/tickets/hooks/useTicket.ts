import { useQuery } from "@tanstack/react-query";
import { getTicketByNumber } from "../api/ticketsApi";

export function ticketQueryKey(projectId: string, ticketNumber: number) {
  return ["projects", projectId, "tickets", "byNumber", ticketNumber] as const;
}

export function useTicket(projectId: string | undefined, ticketNumber: number | undefined) {
  return useQuery({
    queryKey: ticketQueryKey(projectId!, ticketNumber!),
    queryFn: () => getTicketByNumber(projectId!, ticketNumber!).then((res) => res.data),
    enabled: !!projectId && !!ticketNumber,
  });
}
