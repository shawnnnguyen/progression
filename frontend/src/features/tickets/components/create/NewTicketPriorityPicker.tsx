import { ChevronDownIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PriorityIcon } from "@/components/domain/PriorityIcon";
import type { Priority } from "../../types";
import { fieldTriggerClassName } from "../metadata/fieldStyles";

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

export function NewTicketPriorityPicker({
  value,
  onChange,
}: {
  value: Priority;
  onChange: (priority: Priority) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={fieldTriggerClassName(true)}>
        <PriorityIcon priority={value} />
        <span className="min-w-0 truncate">{PRIORITY_LABEL[value]}</span>
        <ChevronDownIcon className="ml-auto size-3.5 shrink-0 text-[var(--color-neutral-500)]" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuRadioGroup value={value} onValueChange={(next) => onChange(next as Priority)}>
          {PRIORITY_OPTIONS.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value}>
              <PriorityIcon priority={option.value} />
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
