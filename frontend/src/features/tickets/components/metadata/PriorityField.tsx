import { ChevronDownIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PriorityIcon } from "@/components/domain/PriorityIcon";
import type { Priority, TicketRow } from "../../types";
import { fieldTriggerClassName, FIELD_LABEL_CLASSNAME } from "./fieldStyles";

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: "URGENT", label: "Urgent" },
  { value: "HIGH", label: "High" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LOW", label: "Low" },
  { value: "NONE", label: "None" },
];

const PRIORITY_LABEL: Record<Priority, string> = Object.fromEntries(
  PRIORITY_OPTIONS.map((option) => [option.value, option.label]),
) as Record<Priority, string>;

export function PriorityField({
  ticket,
  compact,
  disabled,
  onChange,
}: {
  ticket: TicketRow;
  compact?: boolean;
  disabled?: boolean;
  onChange: (priority: Priority) => void;
}) {
  return (
    <div className={compact ? undefined : "flex flex-col gap-1"}>
      {!compact && <span className={FIELD_LABEL_CLASSNAME}>Priority</span>}
      <DropdownMenu>
        <DropdownMenuTrigger disabled={disabled} className={fieldTriggerClassName(compact)}>
          <PriorityIcon priority={ticket.priority} />
          <span className="min-w-0 truncate">{PRIORITY_LABEL[ticket.priority]}</span>
          <ChevronDownIcon className="ml-auto size-3.5 shrink-0 text-[var(--color-neutral-500)]" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuRadioGroup value={ticket.priority} onValueChange={(value) => onChange(value as Priority)}>
            {PRIORITY_OPTIONS.map((option) => (
              <DropdownMenuRadioItem key={option.value} value={option.value}>
                <PriorityIcon priority={option.value} />
                {option.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
