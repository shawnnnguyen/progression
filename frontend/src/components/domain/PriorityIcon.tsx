import { cn } from "@/lib/utils";
import type { Priority } from "@/features/tickets/types";

const OFF = "var(--color-neutral-800)";

const PRIORITY_CONFIG: Record<Priority, { on: string; bars: 0 | 1 | 2 | 3; label: string }> = {
  URGENT: { on: "var(--color-accent-300)", bars: 3, label: "Urgent priority" },
  HIGH: { on: "var(--color-accent-400)", bars: 3, label: "High priority" },
  MEDIUM: { on: "var(--color-accent-500)", bars: 2, label: "Medium priority" },
  LOW: { on: "var(--color-neutral-500)", bars: 1, label: "Low priority" },
  NONE: { on: OFF, bars: 0, label: "No priority" },
};

const BAR_HEIGHTS = ["h-[5px]", "h-2", "h-[11px]"];

export function PriorityIcon({ priority, className }: { priority: Priority; className?: string }) {
  const { on, bars, label } = PRIORITY_CONFIG[priority];
  return (
    <span title={label} aria-label={label} className={cn("inline-flex h-3 items-end gap-0.5", className)}>
      {BAR_HEIGHTS.map((heightClassName, index) => (
        <span
          key={index}
          className={cn("w-[3px] rounded-[1px]", heightClassName)}
          style={{ backgroundColor: index < bars ? on : OFF }}
        />
      ))}
    </span>
  );
}
