import type { EffectiveProjectMember } from "@/features/projects/types";
import type { TicketRow } from "@/features/tickets/types";
import type { WorkflowState } from "@/features/workflow/types";
import { WorkflowColumn } from "./WorkflowColumn";

export function BoardColumns({
  states,
  tickets,
  memberMap,
  activeTicketId,
  legalStateIds,
  legalityLoading,
  projectKey,
  onOpenTicket,
}: {
  states: WorkflowState[];
  tickets: TicketRow[];
  memberMap: Map<string, EffectiveProjectMember>;
  activeTicketId: string | undefined;
  legalStateIds: Set<string>;
  legalityLoading: boolean;
  projectKey: string;
  onOpenTicket?: (ticket: TicketRow) => void;
}) {
  return (
    <div className="flex gap-4">
      {states.map((state) => (
        <WorkflowColumn
          key={state.id}
          state={state}
          tickets={tickets.filter((ticket) => ticket.stateId === state.id)}
          memberMap={memberMap}
          activeTicketId={activeTicketId}
          legalStateIds={legalStateIds}
          legalityLoading={legalityLoading}
          projectKey={projectKey}
          onOpenTicket={onOpenTicket}
        />
      ))}
    </div>
  );
}
