import { Separator } from "@/components/ui/separator";
import { useTransitionTicket } from "../hooks/useTransitionTicket";
import { useUpdateTicket } from "../hooks/useUpdateTicket";
import { formatDateOnly, formatRelativeTime } from "../lib/formatTimestamp";
import type { TicketRow } from "../types";
import { AssigneeField } from "./metadata/AssigneeField";
import { LabelsField } from "./metadata/LabelsField";
import { PriorityField } from "./metadata/PriorityField";
import { ReporterField } from "./metadata/ReporterField";
import { SprintField } from "./metadata/SprintField";
import { StateField } from "./metadata/StateField";

export function TicketDetailRail({ ticket, projectId }: { ticket: TicketRow; projectId: string }) {
  const updateTicket = useUpdateTicket(projectId, ticket.id, ticket.number);
  const transitionTicket = useTransitionTicket(projectId, {});
  const isSaving = updateTicket.isPending || transitionTicket.isPending;

  return (
    <div className="flex w-70 shrink-0 flex-col gap-4 border-l border-[var(--color-divider)] p-4">
      <StateField
        ticket={ticket}
        projectId={projectId}
        disabled={isSaving}
        onTransition={(toStateId) => transitionTicket.mutate({ ticketId: ticket.id, toStateId, version: ticket.version })}
      />
      <PriorityField
        ticket={ticket}
        disabled={isSaving}
        onChange={(priority) => updateTicket.mutate({ version: ticket.version, priority })}
      />
      <AssigneeField
        ticket={ticket}
        projectId={projectId}
        disabled={isSaving}
        onChange={(assigneeId) => updateTicket.mutate({ version: ticket.version, assigneeId })}
      />
      <ReporterField ticket={ticket} projectId={projectId} />
      <SprintField
        ticket={ticket}
        projectId={projectId}
        disabled={isSaving}
        onChange={(sprintId) => updateTicket.mutate({ version: ticket.version, sprintId })}
      />
      <LabelsField
        ticket={ticket}
        projectId={projectId}
        disabled={isSaving}
        onChange={(labelIds) => updateTicket.mutate({ version: ticket.version, labelIds })}
      />

      <Separator />

      <div className="text-xs text-[var(--color-neutral-500)]">
        Created <span className="font-semibold">{formatDateOnly(ticket.createdAt)}</span> · updated{" "}
        <span className="font-semibold">{formatRelativeTime(ticket.updatedAt)}</span>
      </div>
    </div>
  );
}
