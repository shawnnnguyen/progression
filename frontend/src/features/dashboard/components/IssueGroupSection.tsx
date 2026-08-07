import { TicketListItem } from "@/features/tickets/components/TicketListItem";
import { StateDot } from "@/components/domain/StateDot";
import type { TicketRow } from "@/features/tickets/types";
import type { StateCategory } from "@/features/workflow/types";
import type { Sprint } from "@/features/sprints/types";

export function IssueGroupSection({
  title,
  category,
  tickets,
  projectKeyById,
  sprintById,
}: {
  title: string;
  category: StateCategory;
  tickets: TicketRow[];
  projectKeyById: Map<string, string>;
  sprintById: Map<string, Sprint>;
}) {
  return (
    <section className="flex flex-col gap-1">
      <h2 className="flex items-center gap-2 px-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        <StateDot category={category} />
        {title} · {tickets.length}
      </h2>
      <div className="flex flex-col">
        {tickets.map((ticket) => (
          <TicketListItem
            key={ticket.id}
            ticket={ticket}
            projectKey={projectKeyById.get(ticket.projectId) ?? "?"}
            sprint={ticket.sprintId ? sprintById.get(ticket.sprintId) : undefined}
          />
        ))}
      </div>
    </section>
  );
}
