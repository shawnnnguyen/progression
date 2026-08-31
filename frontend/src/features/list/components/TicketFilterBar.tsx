import { useRef, useState, type Dispatch, type SetStateAction } from "react";
import { SortControl } from "./SortControl";
import { TicketFilterField } from "./TicketFilterField";
import type { SortOption } from "../lib/sortTickets";
import type { TicketFilters } from "@/features/tickets/types";
import type { WorkflowState } from "@/features/workflow/types";
import type { EffectiveProjectMember } from "@/features/projects/types";
import type { Label } from "@/features/labels/types";
import type { Sprint } from "@/features/sprints/types";

interface TicketFilterBarProps {
  filters: TicketFilters;
  onFiltersChange: Dispatch<SetStateAction<TicketFilters>>;
  states: WorkflowState[];
  members: EffectiveProjectMember[];
  labels: Label[];
  sprints: Sprint[];
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
}

function setFilter(filters: TicketFilters, key: keyof TicketFilters, value: string): TicketFilters {
  if (!value) return removeFilter(filters, key);
  return { ...filters, [key]: value };
}

function removeFilter(filters: TicketFilters, key: keyof TicketFilters): TicketFilters {
  const next = { ...filters };
  delete next[key];
  return next;
}

function SearchInput({
  value,
  onFiltersChange,
}: {
  value: string;
  onFiltersChange: Dispatch<SetStateAction<TicketFilters>>;
}) {
  const [localValue, setLocalValue] = useState(value);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  return (
    <input
      type="text"
      value={localValue}
      onChange={(event) => {
        const next = event.target.value;
        setLocalValue(next);
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => onFiltersChange((prev) => setFilter(prev, "q", next)), 300);
      }}
      placeholder="Search tickets…"
      className="h-7 rounded-md border border-input bg-background px-2 text-xs"
      aria-label="Search tickets"
    />
  );
}

export function TicketFilterBar({
  filters,
  onFiltersChange,
  states,
  members,
  labels,
  sprints,
  sort,
  onSortChange,
}: TicketFilterBarProps) {
  const state = states.find((s) => s.id === filters.state);
  const member = members.find((m) => m.userId === filters.assignee);
  const label = labels.find((l) => l.id === filters.label);
  const sprint = sprints.find((s) => s.id === filters.sprint);
  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <div className="flex flex-wrap items-center gap-1.5 border-b border-border px-4 py-2">
      <TicketFilterField
        label="State"
        ariaLabel="Filter by state"
        anyLabel="All states"
        value={filters.state ?? ""}
        activeLabel={state?.name}
        options={states.map((s) => ({ value: s.id, label: s.name }))}
        onChange={(value) => onFiltersChange((prev) => setFilter(prev, "state", value))}
      />
      <TicketFilterField
        label="Assignee"
        ariaLabel="Filter by assignee"
        anyLabel="Any assignee"
        value={filters.assignee ?? ""}
        activeLabel={member?.name}
        options={members.map((m) => ({ value: m.userId, label: m.name }))}
        onChange={(value) => onFiltersChange((prev) => setFilter(prev, "assignee", value))}
      />
      <TicketFilterField
        label="Label"
        ariaLabel="Filter by label"
        anyLabel="Any label"
        value={filters.label ?? ""}
        activeLabel={label?.name}
        options={labels.map((l) => ({ value: l.id, label: l.name }))}
        onChange={(value) => onFiltersChange((prev) => setFilter(prev, "label", value))}
      />
      <TicketFilterField
        label="Sprint"
        ariaLabel="Filter by sprint"
        anyLabel="Any sprint"
        value={filters.sprint ?? ""}
        activeLabel={sprint?.name}
        options={sprints.map((s) => ({ value: s.id, label: s.name }))}
        onChange={(value) => onFiltersChange((prev) => setFilter(prev, "sprint", value))}
      />
      <SearchInput key={filters.q ?? "empty"} value={filters.q ?? ""} onFiltersChange={onFiltersChange} />
      {hasActiveFilters && (
        <button
          type="button"
          onClick={() => onFiltersChange({})}
          className="text-xs font-medium text-primary outline-none hover:underline underline-offset-4"
        >
          Clear all
        </button>
      )}
      <div className="ml-auto">
        <SortControl value={sort} onChange={onSortChange} />
      </div>
    </div>
  );
}
