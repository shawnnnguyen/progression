import { useProjectTickets } from "./useProjectTickets";
import { useWorkflowStateMap } from "@/features/workflow/hooks/useWorkflowStateMap";

/** Derives B1's "Active projects" open-count/progress approximation — no aggregate endpoint exists. */
export function useProjectTicketsSummary(projectId: string | undefined) {
  const ticketsQuery = useProjectTickets(projectId, {});
  const { stateMap } = useWorkflowStateMap(projectId);

  const tickets = ticketsQuery.data?.tickets ?? [];
  const total = tickets.length;
  const doneCount = tickets.filter((ticket) => stateMap.get(ticket.stateId)?.category === "DONE").length;

  return {
    isLoading: ticketsQuery.isLoading,
    isCapped: ticketsQuery.data?.isCapped ?? false,
    total,
    openCount: total - doneCount,
    doneCount,
  };
}
