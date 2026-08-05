import type { TicketRow } from "@/features/tickets/types";
import type { StateCategory, WorkflowState } from "@/features/workflow/types";
import { IssueGroupSection } from "./IssueGroupSection";

// Groups by real StateCategory (not a project-specific WorkflowState.name like
// the design mock's literal "QA" header) since a name can't generalize across
// projects with different workflows.
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
  isCapped,
}: {
  tickets: TicketRow[];
  stateById: Map<string, WorkflowState>;
  projectKeyById: Map<string, string>;
  isCapped: boolean;
}) {
  const groups = GROUP_ORDER.map((category) => ({
    category,
    tickets: tickets.filter((ticket) => stateById.get(ticket.stateId)?.category === category),
  })).filter((group) => group.tickets.length > 0);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-semibold">My Issues</h1>
      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tickets assigned to you</p>
      ) : (
        groups.map((group) => (
          <IssueGroupSection
            key={group.category}
            title={GROUP_LABELS[group.category]}
            tickets={group.tickets}
            stateById={stateById}
            projectKeyById={projectKeyById}
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
