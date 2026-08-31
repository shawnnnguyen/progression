import { useProjectTickets } from "./useProjectTickets";
import { useWorkflowStates } from "@/features/workflow/hooks/useWorkflowStates";

export interface SprintStateBreakdown {
  stateId: string;
  name: string;
  count: number;
}

/** Mirrors useProjectTicketsSummary, scoped to one sprint — no aggregate endpoint exists. */
export function useSprintTicketsSummary(projectId: string | undefined, sprintId: string | undefined) {
  const ticketsQuery = useProjectTickets(projectId, { sprint: sprintId });
  const statesQuery = useWorkflowStates(projectId);

  const tickets = ticketsQuery.data?.tickets ?? [];
  const states = statesQuery.data ?? [];

  const stateById = new Map(states.map((state) => [state.id, state]));
  const counts = new Map<string, number>();
  let doneCount = 0;
  let remainingCount = 0;
  for (const ticket of tickets) {
    counts.set(ticket.stateId, (counts.get(ticket.stateId) ?? 0) + 1);
    const category = stateById.get(ticket.stateId)?.category;
    if (category === "DONE") doneCount++;
    else if (category !== "CANCELED") remainingCount++;
  }
  const breakdown: SprintStateBreakdown[] = states
    .map((state) => ({ stateId: state.id, name: state.name, count: counts.get(state.id) ?? 0 }))
    .filter((entry) => entry.count > 0);
  const total = tickets.length;

  return {
    isLoading: ticketsQuery.isLoading || statesQuery.isLoading,
    total,
    doneCount,
    remainingCount,
    breakdown,
  };
}
