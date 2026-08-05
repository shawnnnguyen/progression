import { Card, CardContent } from "@/components/ui/card";
import { PriorityIcon } from "@/components/domain/PriorityIcon";
import { UserAvatar } from "@/components/domain/UserAvatar";
import type { EffectiveProjectMember } from "@/features/projects/types";
import type { TicketRow as Ticket } from "../types";

export function TicketCard({
  ticket,
  assignee,
}: {
  ticket: Ticket;
  assignee: EffectiveProjectMember | undefined;
}) {
  return (
    <Card className="gap-2 p-3">
      <CardContent className="flex flex-col gap-2 p-0">
        <span className="text-xs text-muted-foreground">#{ticket.number}</span>
        <p className="text-sm leading-snug font-medium">{ticket.title}</p>
        <div className="flex items-center justify-between">
          <PriorityIcon priority={ticket.priority} />
          {ticket.assigneeId && (
            <UserAvatar
              userId={ticket.assigneeId}
              name={assignee?.name}
              avatarUrl={assignee?.avatarUrl}
              size="sm"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
