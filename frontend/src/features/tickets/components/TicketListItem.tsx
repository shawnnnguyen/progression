import { Link } from "react-router-dom";
import { PriorityIcon } from "@/components/domain/PriorityIcon";
import { StateDot } from "@/components/domain/StateDot";
import type { WorkflowState } from "@/features/workflow/types";
import type { TicketRow as Ticket } from "../types";

export function TicketListItem({
  ticket,
  state,
  projectKey,
}: {
  ticket: Ticket;
  state: WorkflowState | undefined;
  projectKey: string;
}) {
  return (
    <Link
      to={`/projects/${ticket.projectId}/board`}
      className="flex items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-muted"
    >
      {state && <StateDot category={state.category} />}
      <span className="font-mono text-xs text-muted-foreground">
        {projectKey}-{ticket.number}
      </span>
      <span className="flex-1 truncate">{ticket.title}</span>
      <PriorityIcon priority={ticket.priority} />
    </Link>
  );
}
