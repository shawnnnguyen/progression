import { UserAvatar } from "@/components/domain/UserAvatar";
import { useCurrentOrg } from "@/features/orgs/hooks/useCurrentOrg";
import { useOrgMemberMap } from "@/features/orgs/hooks/useOrgMembers";
import { useProjectMemberMap } from "@/features/projects/hooks/useProjectMembers";
import type { TicketRow } from "../../types";
import { FIELD_LABEL_CLASSNAME } from "./fieldStyles";

export function ReporterField({
  ticket,
  projectId,
  compact,
}: {
  ticket: TicketRow;
  projectId: string;
  compact?: boolean;
}) {
  const { memberMap } = useProjectMemberMap(projectId);
  const { currentOrgId } = useCurrentOrg();
  const { memberMap: orgMemberMap } = useOrgMemberMap(currentOrgId);
  const reporter = memberMap.get(ticket.reporterId) ?? orgMemberMap.get(ticket.reporterId);

  return (
    <div className={compact ? undefined : "flex flex-col gap-1"}>
      {!compact && <span className={FIELD_LABEL_CLASSNAME}>Reporter</span>}
      <div className="flex items-center gap-1.5 px-0.5 py-1 text-sm text-[var(--color-text)]">
        <UserAvatar userId={ticket.reporterId} name={reporter?.name} avatarUrl={reporter?.avatarUrl} size="sm" />
        <span className="truncate">{reporter?.name ?? "Unknown"}</span>
      </div>
    </div>
  );
}
