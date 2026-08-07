import { TableCell, TableRow as UiTableRow } from "@/components/ui/table";
import { PriorityIcon } from "@/components/domain/PriorityIcon";
import { StateDot } from "@/components/domain/StateDot";
import { UserAvatar } from "@/components/domain/UserAvatar";
import { LabelTag } from "@/components/domain/LabelTag";
import { cn } from "@/lib/utils";
import type { EffectiveProjectMember } from "@/features/projects/types";
import type { WorkflowState } from "@/features/workflow/types";
import type { Sprint } from "@/features/sprints/types";
import type { TicketRow as Ticket } from "../types";

export function TicketRow({
  ticket,
  state,
  assignee,
  sprint,
  projectKey,
  onOpen,
}: {
  ticket: Ticket;
  state: WorkflowState | undefined;
  assignee: EffectiveProjectMember | undefined;
  sprint: Sprint | undefined;
  projectKey: string;
  onOpen?: (ticket: Ticket) => void;
}) {
  return (
    <UiTableRow className={onOpen ? "cursor-pointer" : undefined} onClick={onOpen ? () => onOpen(ticket) : undefined}>
      <TableCell>
        <PriorityIcon priority={ticket.priority} />
      </TableCell>
      <TableCell className="text-sm font-medium text-muted-foreground">
        {projectKey}-{ticket.number}
      </TableCell>
      <TableCell className="max-w-md truncate text-sm">{ticket.title}</TableCell>
      <TableCell className="overflow-hidden">
        {state && (
          <span className="flex items-center gap-1.5 text-sm">
            <StateDot category={state.category} />
            <span className="truncate">{state.name}</span>
          </span>
        )}
      </TableCell>
      <TableCell className="overflow-hidden">
        <span className={cn("flex items-center gap-1.5 text-sm", !ticket.assigneeId && "text-muted-foreground")}>
          <UserAvatar userId={ticket.assigneeId} name={assignee?.name} avatarUrl={assignee?.avatarUrl} size="sm" />
          <span className="truncate">{ticket.assigneeId ? assignee?.name : "Unassigned"}</span>
        </span>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">{sprint?.name ?? "—"}</TableCell>
      <TableCell>
        {ticket.labels.length === 0 ? (
          <span className="text-sm text-muted-foreground">—</span>
        ) : (
          <div className="flex flex-wrap items-center gap-1">
            {ticket.labels.map((label) => (
              <LabelTag key={label.id} label={label} />
            ))}
          </div>
        )}
      </TableCell>
    </UiTableRow>
  );
}
