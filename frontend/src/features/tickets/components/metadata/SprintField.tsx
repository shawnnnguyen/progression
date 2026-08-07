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
import type { TicketRow } from "../../types";
import { fieldTriggerClassName, FIELD_LABEL_CLASSNAME } from "./fieldStyles";

const NO_SPRINT_VALUE = "__no_sprint__";

export function SprintField({
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
  onChange: (sprintId: string | null) => void;
}) {
  const { data: sprints } = useSprints(projectId);
  const sprint = sprints?.find((s) => s.id === ticket.sprintId);

  return (
    <div className={compact ? undefined : "flex flex-col gap-1"}>
      {!compact && <span className={FIELD_LABEL_CLASSNAME}>Sprint</span>}
      <DropdownMenu>
        <DropdownMenuTrigger disabled={disabled} className={fieldTriggerClassName(compact)}>
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
            value={ticket.sprintId ?? NO_SPRINT_VALUE}
            onValueChange={(value) => onChange(value === NO_SPRINT_VALUE ? null : (value as string))}
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
    </div>
  );
}
