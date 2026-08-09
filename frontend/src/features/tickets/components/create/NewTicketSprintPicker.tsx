import { ChevronDownIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useSprints } from "@/features/sprints/hooks/useSprints";
import { fieldTriggerClassName } from "../metadata/fieldStyles";

const NO_SPRINT_VALUE = "__no_sprint__";

export function NewTicketSprintPicker({
  projectId,
  value,
  onChange,
}: {
  projectId: string;
  value: string | null;
  onChange: (sprintId: string | null) => void;
}) {
  const { data: sprints } = useSprints(projectId);
  const sprint = sprints?.find((s) => s.id === value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={fieldTriggerClassName(true)}>
        {sprint?.status === "ACTIVE" && (
          <Badge variant="secondary" className="px-1 py-0 text-[10px] uppercase">
            Active
          </Badge>
        )}
        <span className="min-w-0 truncate">{sprint?.name ?? "No sprint"}</span>
        <ChevronDownIcon className="ml-auto size-3.5 shrink-0 text-[var(--color-neutral-500)]" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuRadioGroup
          value={value ?? NO_SPRINT_VALUE}
          onValueChange={(next) => onChange(next === NO_SPRINT_VALUE ? null : (next as string))}
        >
          <DropdownMenuRadioItem value={NO_SPRINT_VALUE}>No sprint</DropdownMenuRadioItem>
          {sprints?.map((s) => (
            <DropdownMenuRadioItem key={s.id} value={s.id}>
              {s.status === "ACTIVE" && (
                <Badge variant="secondary" className="px-1 py-0 text-[10px] uppercase">
                  Active
                </Badge>
              )}
              {s.name}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
