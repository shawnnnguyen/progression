import type { ReactNode } from "react";
import { PriorityIcon } from "@/components/domain/PriorityIcon";
import { useProjectMemberMap } from "@/features/projects/hooks/useProjectMembers";
import type { TicketRow } from "../types";
import { formatDateOnly } from "../lib/formatTimestamp";
import { ActivityFeed } from "./ActivityFeed";
import { CommentComposer } from "./CommentComposer";
import { TicketDescriptionField } from "./TicketDescriptionField";
import { TicketTitleField } from "./TicketTitleField";

export function TicketDetailContent({
  ticket,
  projectId,
  projectKey,
  showTabs = true,
  showByline = true,
  metaSlot,
}: {
  ticket: TicketRow;
  projectId: string;
  projectKey: string;
  showTabs?: boolean;
  showByline?: boolean;
  metaSlot?: ReactNode;
}) {
  const { memberMap } = useProjectMemberMap(projectId);
  const reporter = memberMap.get(ticket.reporterId);

  return (
    <div className="flex flex-col gap-4">
      {showByline && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--color-neutral-500)]">
          <span className="font-semibold text-[var(--color-neutral-300)]">
            {projectKey}-{ticket.number}
          </span>
          <PriorityIcon priority={ticket.priority} />
          <span className="font-medium text-[var(--color-neutral-400)]">
            · opened by{" "}
            <span className="text-[var(--color-accent-2)]">{reporter?.name ?? "Unknown"}</span> on{" "}
            <span className="text-[var(--color-accent-2)]">{formatDateOnly(ticket.createdAt)}</span>
          </span>
        </div>
      )}

      <TicketTitleField ticket={ticket} projectId={projectId} />

      {metaSlot}

      <TicketDescriptionField ticket={ticket} projectId={projectId} />

      <div className="mt-2">
        <ActivityFeed ticketId={ticket.id} projectId={projectId} showTabs={showTabs} />
      </div>

      <CommentComposer ticketId={ticket.id} />
    </div>
  );
}
