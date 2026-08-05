import { useRef, useState, type Dispatch, type SetStateAction } from "react";
import { FilterChip } from "@/components/domain/FilterChip";
import { SortControl } from "./SortControl";
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

// Deletes the key outright rather than setting it to `undefined` — an
// undefined-valued key would still count toward Object.keys(filters).length,
// which the empty-state check in ProjectListPage relies on to tell "no
// filters" apart from "filters applied but nothing matched".
function setFilter(filters: TicketFilters, key: keyof TicketFilters, value: string): TicketFilters {
  if (!value) return removeFilter(filters, key);
  return { ...filters, [key]: value };
}

function removeFilter(filters: TicketFilters, key: keyof TicketFilters): TicketFilters {
  const next = { ...filters };
  delete next[key];
  return next;
}

// Debounces the search box via a timer started from its own onChange handler
// (not a useEffect watching state), and remounts via `key` when the committed
// value changes from outside (e.g. "Clear all") to pick up that reset. The
// timer's own callback only ever closes over the keystroke's own `next` value
// and calls `onChange` with a functional updater — never over `filters`
// directly — so a filter change elsewhere while the timer is still pending
// can't be silently clobbered when it fires.
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
      className="h-8 rounded-md border border-input bg-background px-2 text-sm"
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
  const activeChips: { key: keyof TicketFilters; label: string }[] = [];
  const state = states.find((s) => s.id === filters.state);
  if (state) activeChips.push({ key: "state", label: `State: ${state.name}` });
  const member = members.find((m) => m.userId === filters.assignee);
  if (member) activeChips.push({ key: "assignee", label: `Assignee: ${member.name}` });
  const label = labels.find((l) => l.id === filters.label);
  if (label) activeChips.push({ key: "label", label: `Label: ${label.name}` });
  const sprint = sprints.find((s) => s.id === filters.sprint);
  if (sprint) activeChips.push({ key: "sprint", label: `Sprint: ${sprint.name}` });
  if (filters.q) activeChips.push({ key: "q", label: `Search: ${filters.q}` });

  return (
    <div className="flex flex-col gap-3 border-b border-border px-6 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={filters.state ?? ""}
          onChange={(event) => onFiltersChange((prev) => setFilter(prev, "state", event.target.value))}
          className="h-8 rounded-md border border-input bg-background px-2 text-sm"
          aria-label="Filter by state"
        >
          <option value="">All states</option>
          {states.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          value={filters.assignee ?? ""}
          onChange={(event) => onFiltersChange((prev) => setFilter(prev, "assignee", event.target.value))}
          className="h-8 rounded-md border border-input bg-background px-2 text-sm"
          aria-label="Filter by assignee"
        >
          <option value="">Any assignee</option>
          {members.map((m) => (
            <option key={m.userId} value={m.userId}>
              {m.name}
            </option>
          ))}
        </select>
        <select
          value={filters.label ?? ""}
          onChange={(event) => onFiltersChange((prev) => setFilter(prev, "label", event.target.value))}
          className="h-8 rounded-md border border-input bg-background px-2 text-sm"
          aria-label="Filter by label"
        >
          <option value="">Any label</option>
          {labels.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
        <select
          value={filters.sprint ?? ""}
          onChange={(event) => onFiltersChange((prev) => setFilter(prev, "sprint", event.target.value))}
          className="h-8 rounded-md border border-input bg-background px-2 text-sm"
          aria-label="Filter by sprint"
        >
          <option value="">Any sprint</option>
          {sprints.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <SearchInput key={filters.q ?? "empty"} value={filters.q ?? ""} onFiltersChange={onFiltersChange} />
        <div className="ml-auto">
          <SortControl value={sort} onChange={onSortChange} />
        </div>
      </div>
      {activeChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {activeChips.map((chip) => (
            <FilterChip
              key={chip.key}
              label={chip.label}
              onRemove={() => onFiltersChange((prev) => removeFilter(prev, chip.key))}
            />
          ))}
          <button
            type="button"
            onClick={() => onFiltersChange({})}
            className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
