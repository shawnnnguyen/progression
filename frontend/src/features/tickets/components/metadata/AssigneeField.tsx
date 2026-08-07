import { ChevronDownIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/domain/UserAvatar";
import { useProjectMemberMap } from "@/features/projects/hooks/useProjectMembers";
import type { TicketRow } from "../../types";
import { fieldTriggerClassName, FIELD_LABEL_CLASSNAME } from "./fieldStyles";

const UNASSIGNED_VALUE = "__unassigned__";

export function AssigneeField({
  ticket,
  projectId,
  compact,
  disabled,
  onChange,
}: {
  ticket: TicketRow;
  projectId: string;
  compact?: boolean;
  disabled?: boolean;
  onChange: (assigneeId: string | null) => void;
}) {
  const { data: members, memberMap } = useProjectMemberMap(projectId);
  const assignee = ticket.assigneeId ? memberMap.get(ticket.assigneeId) : undefined;

  return (
    <div className={compact ? undefined : "flex flex-col gap-1"}>
      {!compact && <span className={FIELD_LABEL_CLASSNAME}>Assignee</span>}
      <DropdownMenu>
        <DropdownMenuTrigger disabled={disabled} className={fieldTriggerClassName(compact)}>
          <UserAvatar userId={ticket.assigneeId} name={assignee?.name} avatarUrl={assignee?.avatarUrl} size="sm" />
          <span className="min-w-0 truncate">{ticket.assigneeId ? (assignee?.name ?? "Unknown") : "Unassigned"}</span>
          <ChevronDownIcon className="ml-auto size-3.5 shrink-0 text-[var(--color-neutral-500)]" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuRadioGroup
            value={ticket.assigneeId ?? UNASSIGNED_VALUE}
            onValueChange={(value) => onChange(value === UNASSIGNED_VALUE ? null : (value as string))}
          >
            <DropdownMenuRadioItem value={UNASSIGNED_VALUE}>
              <UserAvatar userId={null} size="sm" />
              Unassigned
            </DropdownMenuRadioItem>
            {members?.map((member) => (
              <DropdownMenuRadioItem key={member.userId} value={member.userId}>
                <UserAvatar userId={member.userId} name={member.name} avatarUrl={member.avatarUrl} size="sm" />
                {member.name}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
