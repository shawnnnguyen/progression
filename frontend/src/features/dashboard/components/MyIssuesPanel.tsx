import type { TicketRow } from "@/features/tickets/types";
import type { StateCategory, WorkflowState } from "@/features/workflow/types";
import type { Sprint } from "@/features/sprints/types";
import { IssueGroupSection } from "./IssueGroupSection";

const GROUP_ORDER: StateCategory[] = ["INPROGRESS", "TODO", "BACKLOG"];
const GROUP_LABELS: Record<StateCategory, string> = {
  INPROGRESS: "In Progress",
  TODO: "Todo",
  BACKLOG: "Backlog",
  DONE: "Done",
  CANCELED: "Canceled",
};

export function MyIssuesPanel({
  tickets,
  stateById,
  projectKeyById,
  sprintById,
  isCapped,
}: {
  tickets: TicketRow[];
  stateById: Map<string, WorkflowState>;
  projectKeyById: Map<string, string>;
  sprintById: Map<string, Sprint>;
  isCapped: boolean;
}) {
  const groups = GROUP_ORDER.map((category) => ({
    category,
    tickets: tickets.filter((ticket) => stateById.get(ticket.stateId)?.category === category),
  })).filter((group) => group.tickets.length > 0);

  return (
    <div className="flex flex-col gap-6">
      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tickets assigned to you</p>
      ) : (
        groups.map((group) => (
          <IssueGroupSection
            key={group.category}
            title={GROUP_LABELS[group.category]}
            category={group.category}
            tickets={group.tickets}
            projectKeyById={projectKeyById}
            sprintById={sprintById}
          />
        ))
      )}
      {isCapped && (
        <p className="text-xs text-muted-foreground">
          Showing the first {tickets.length} tickets — you have more.
        </p>
      )}
    </div>
  );
}
