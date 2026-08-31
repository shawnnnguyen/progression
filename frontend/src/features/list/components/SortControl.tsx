import { ChevronDownIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { SortOption } from "../lib/sortTickets";

const OPTIONS: { value: SortOption; label: string }[] = [
  { value: "default", label: "Newest" },
  { value: "priority-desc", label: "Priority: High to Low" },
  { value: "priority-asc", label: "Priority: Low to High" },
  { value: "updated-desc", label: "Recently updated" },
];

export function SortControl({ value, onChange }: { value: SortOption; onChange: (value: SortOption) => void }) {
  const current = OPTIONS.find((option) => option.value === value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Sort tickets"
        className="flex h-7 items-center gap-1 rounded-md px-1.5 text-xs font-medium text-muted-foreground outline-none transition-colors hover:text-foreground data-popup-open:text-foreground"
      >
        Sort: {current?.label ?? "Newest"}
        <ChevronDownIcon className="size-3 shrink-0" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48">
        <DropdownMenuRadioGroup value={value} onValueChange={(next) => onChange(next as SortOption)}>
          {OPTIONS.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value}>
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
