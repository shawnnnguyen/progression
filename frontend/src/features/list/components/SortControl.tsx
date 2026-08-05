import type { SortOption } from "../lib/sortTickets";

const OPTIONS: { value: SortOption; label: string }[] = [
  { value: "default", label: "Newest" },
  { value: "priority-desc", label: "Priority: High to Low" },
  { value: "priority-asc", label: "Priority: Low to High" },
  { value: "updated-desc", label: "Recently updated" },
];

export function SortControl({ value, onChange }: { value: SortOption; onChange: (value: SortOption) => void }) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value as SortOption)}
      className="h-8 rounded-md border border-input bg-background px-2 text-sm"
      aria-label="Sort tickets"
    >
      {OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
