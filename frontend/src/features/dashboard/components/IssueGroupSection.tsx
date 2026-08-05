import { TicketListItem } from "@/features/tickets/components/TicketListItem";
import type { TicketRow } from "@/features/tickets/types";
import type { WorkflowState } from "@/features/workflow/types";

export function IssueGroupSection({
  title,
  tickets,
  stateById,
  projectKeyById,
}: {
  title: string;
  tickets: TicketRow[];
  stateById: Map<string, WorkflowState>;
  projectKeyById: Map<string, string>;
}) {
  return (
    <section className="flex flex-col gap-1">
      <h2 className="px-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {title} · {tickets.length}
      </h2>
      <div className="flex flex-col">
        {tickets.map((ticket) => (
          <TicketListItem
            key={ticket.id}
            ticket={ticket}
            state={stateById.get(ticket.stateId)}
            projectKey={projectKeyById.get(ticket.projectId) ?? "?"}
          />
        ))}
      </div>
    </section>
  );
}
