import { TableCell, TableRow as UiTableRow } from "@/components/ui/table";
import { PriorityIcon } from "@/components/domain/PriorityIcon";
import { StateDot } from "@/components/domain/StateDot";
import { UserAvatar } from "@/components/domain/UserAvatar";
import type { EffectiveProjectMember } from "@/features/projects/types";
import type { WorkflowState } from "@/features/workflow/types";
import type { TicketRow as Ticket } from "../types";

export function TicketRow({
  ticket,
  state,
  assignee,
}: {
  ticket: Ticket;
  state: WorkflowState | undefined;
  assignee: EffectiveProjectMember | undefined;
}) {
  return (
    <UiTableRow>
      <TableCell className="font-mono text-xs text-muted-foreground">#{ticket.number}</TableCell>
      <TableCell className="max-w-md truncate">{ticket.title}</TableCell>
      <TableCell>
        {state && (
          <span className="flex items-center gap-1.5 text-sm">
            <StateDot category={state.category} />
            {state.name}
          </span>
        )}
      </TableCell>
      <TableCell>
        <PriorityIcon priority={ticket.priority} />
      </TableCell>
      <TableCell className="text-muted-foreground">—</TableCell>
      <TableCell>
        {ticket.assigneeId ? (
          <UserAvatar userId={ticket.assigneeId} name={assignee?.name} avatarUrl={assignee?.avatarUrl} size="sm" />
        ) : (
          <span className="text-xs text-muted-foreground">Unassigned</span>
        )}
      </TableCell>
    </UiTableRow>
  );
}
