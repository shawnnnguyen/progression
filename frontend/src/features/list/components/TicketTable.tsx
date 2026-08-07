import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TicketRow } from "@/features/tickets/components/TicketRow";
import type { EffectiveProjectMember } from "@/features/projects/types";
import type { TicketRow as Ticket } from "@/features/tickets/types";
import type { WorkflowState } from "@/features/workflow/types";
import type { Sprint } from "@/features/sprints/types";

export function TicketTable({
  tickets,
  stateMap,
  memberMap,
  sprintMap,
  projectKey,
  onOpenTicket,
}: {
  tickets: Ticket[];
  stateMap: Map<string, WorkflowState>;
  memberMap: Map<string, EffectiveProjectMember>;
  sprintMap: Map<string, Sprint>;
  projectKey: string;
  onOpenTicket?: (ticket: Ticket) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-8"></TableHead>
          <TableHead>Key</TableHead>
          <TableHead>Title</TableHead>
          <TableHead>State</TableHead>
          <TableHead>Assignee</TableHead>
          <TableHead>Sprint</TableHead>
          <TableHead>Labels</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tickets.map((ticket) => (
          <TicketRow
            key={ticket.id}
            ticket={ticket}
            state={stateMap.get(ticket.stateId)}
            assignee={ticket.assigneeId ? memberMap.get(ticket.assigneeId) : undefined}
            sprint={ticket.sprintId ? sprintMap.get(ticket.sprintId) : undefined}
            projectKey={projectKey}
            onOpen={onOpenTicket}
          />
        ))}
      </TableBody>
    </Table>
  );
}
