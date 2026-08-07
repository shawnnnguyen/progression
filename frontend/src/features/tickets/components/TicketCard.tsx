import { PriorityIcon } from "@/components/domain/PriorityIcon";
import { LabelTag } from "@/components/domain/LabelTag";
import { UserAvatar } from "@/components/domain/UserAvatar";
import type { EffectiveProjectMember } from "@/features/projects/types";
import type { TicketRow as Ticket } from "../types";

export function TicketCard({
  ticket,
  assignee,
  projectKey,
  onOpen,
}: {
  ticket: Ticket;
  assignee: EffectiveProjectMember | undefined;
  projectKey: string;
  onOpen?: (ticket: Ticket) => void;
}) {
  return (
    <div
      className="flex h-[128px] flex-col gap-2.5 overflow-hidden rounded-[7px] bg-card p-[9px_10px] outline-transparent outline-2 -outline-offset-1 transition-colors hover:outline-[var(--color-accent-500)] active:bg-[var(--color-accent-500)]/10"
      style={{ boxShadow: "var(--shadow-sm)" }}
      onClick={onOpen ? () => onOpen(ticket) : undefined}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">
          {projectKey}-{ticket.number}
        </span>
        <PriorityIcon priority={ticket.priority} />
      </div>
      <p className="line-clamp-2 text-sm leading-snug font-medium">{ticket.title}</p>
      <div className="mt-auto flex h-8 shrink-0 items-center justify-between gap-2">
        <div className="flex min-w-0 flex-nowrap items-center gap-1 overflow-hidden">
          {ticket.labels.map((label) => (
            <LabelTag key={label.id} label={label} className="shrink-0" />
          ))}
        </div>
        <UserAvatar userId={ticket.assigneeId} name={assignee?.name} avatarUrl={assignee?.avatarUrl} size="sm" />
      </div>
    </div>
  );
}
