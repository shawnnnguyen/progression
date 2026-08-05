import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TicketRow } from "@/features/tickets/components/TicketRow";
import type { EffectiveProjectMember } from "@/features/projects/types";
import type { TicketRow as Ticket } from "@/features/tickets/types";
import type { WorkflowState } from "@/features/workflow/types";

export function TicketTable({
  tickets,
  stateMap,
  memberMap,
}: {
  tickets: Ticket[];
  stateMap: Map<string, WorkflowState>;
  memberMap: Map<string, EffectiveProjectMember>;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Key</TableHead>
          <TableHead>Title</TableHead>
          <TableHead>State</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>Labels</TableHead>
          <TableHead>Assignee</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tickets.map((ticket) => (
          <TicketRow
            key={ticket.id}
            ticket={ticket}
            state={stateMap.get(ticket.stateId)}
            assignee={ticket.assigneeId ? memberMap.get(ticket.assigneeId) : undefined}
          />
        ))}
      </TableBody>
    </Table>
  );
}
