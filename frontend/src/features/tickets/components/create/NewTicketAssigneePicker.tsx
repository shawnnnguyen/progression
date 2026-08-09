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
import { fieldTriggerClassName } from "../metadata/fieldStyles";

const UNASSIGNED_VALUE = "__unassigned__";

export function NewTicketAssigneePicker({
  projectId,
  value,
  onChange,
}: {
  projectId: string;
  value: string | null;
  onChange: (assigneeId: string | null) => void;
}) {
  const { data: members, memberMap } = useProjectMemberMap(projectId);
  const assignee = value ? memberMap.get(value) : undefined;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={fieldTriggerClassName(true)}>
        <UserAvatar userId={value} name={assignee?.name} avatarUrl={assignee?.avatarUrl} size="sm" />
        <span className="min-w-0 truncate">{value ? (assignee?.name ?? "Unknown") : "Unassigned"}</span>
        <ChevronDownIcon className="ml-auto size-3.5 shrink-0 text-[var(--color-neutral-500)]" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuRadioGroup
          value={value ?? UNASSIGNED_VALUE}
          onValueChange={(next) => onChange(next === UNASSIGNED_VALUE ? null : (next as string))}
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
  );
}
