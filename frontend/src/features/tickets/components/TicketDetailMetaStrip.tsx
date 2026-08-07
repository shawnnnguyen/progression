import { useTransitionTicket } from "../hooks/useTransitionTicket";
import { useUpdateTicket } from "../hooks/useUpdateTicket";
import type { TicketRow } from "../types";
import { AssigneeField } from "./metadata/AssigneeField";
import { LabelsField } from "./metadata/LabelsField";
import { PriorityField } from "./metadata/PriorityField";
import { SprintField } from "./metadata/SprintField";
import { StateField } from "./metadata/StateField";

export function TicketDetailMetaStrip({ ticket, projectId }: { ticket: TicketRow; projectId: string }) {
  const updateTicket = useUpdateTicket(projectId, ticket.id, ticket.number);
  const transitionTicket = useTransitionTicket(projectId, {});
  const isSaving = updateTicket.isPending || transitionTicket.isPending;

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-[var(--color-divider)] pb-3">
      <StateField
        ticket={ticket}
        projectId={projectId}
        compact
        disabled={isSaving}
        onTransition={(toStateId) => transitionTicket.mutate({ ticketId: ticket.id, toStateId, version: ticket.version })}
      />
      <PriorityField
        ticket={ticket}
        compact
        disabled={isSaving}
        onChange={(priority) => updateTicket.mutate({ version: ticket.version, priority })}
      />
      <AssigneeField
        ticket={ticket}
        projectId={projectId}
        compact
        disabled={isSaving}
        onChange={(assigneeId) => updateTicket.mutate({ version: ticket.version, assigneeId })}
      />
      <SprintField
        ticket={ticket}
        projectId={projectId}
        compact
        disabled={isSaving}
        onChange={(sprintId) => updateTicket.mutate({ version: ticket.version, sprintId })}
      />
      <LabelsField
        ticket={ticket}
        projectId={projectId}
        compact
        disabled={isSaving}
        onChange={(labelIds) => updateTicket.mutate({ version: ticket.version, labelIds })}
      />
    </div>
  );
}
