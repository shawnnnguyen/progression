import { Link } from "react-router-dom";
import { PriorityIcon } from "@/components/domain/PriorityIcon";
import { LabelTag } from "@/components/domain/LabelTag";
import { UserAvatar } from "@/components/domain/UserAvatar";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import type { Sprint } from "@/features/sprints/types";
import type { TicketRow as Ticket } from "../types";

export function TicketListItem({
  ticket,
  projectKey,
  sprint,
}: {
  ticket: Ticket;
  projectKey: string;
  sprint: Sprint | undefined;
}) {
  const { user } = useCurrentUser();

  return (
    <Link
      to={`/projects/${ticket.projectId}/tickets/${ticket.number}`}
      className="flex items-center gap-3 rounded-md border-b border-[var(--color-divider)] px-1 py-2 text-sm last:border-b-0 hover:bg-muted"
    >
      <PriorityIcon priority={ticket.priority} />
      <span className="w-16 shrink-0 text-xs text-muted-foreground">
        {projectKey}-{ticket.number}
      </span>
      <span className="flex-1 truncate">{ticket.title}</span>
      {ticket.labels.length > 0 && (
        <div className="flex shrink-0 items-center gap-1">
          {ticket.labels.map((label) => (
            <LabelTag key={label.id} label={label} />
          ))}
        </div>
      )}
      <span className="w-16 shrink-0 text-xs text-muted-foreground">{sprint?.name ?? "—"}</span>
      <UserAvatar userId={ticket.assigneeId ?? user?.id ?? null} name={user?.name} avatarUrl={user?.avatarUrl} size="sm" />
    </Link>
  );
}
