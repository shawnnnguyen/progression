import { ChevronsUp, ChevronUp, Equal, ChevronDown, Minus, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Priority } from "@/features/tickets/types";

const PRIORITY_CONFIG: Record<Priority, { icon: LucideIcon; className: string; label: string }> = {
  URGENT: { icon: ChevronsUp, className: "text-destructive", label: "Urgent priority" },
  HIGH: { icon: ChevronUp, className: "text-orange-400", label: "High priority" },
  MEDIUM: { icon: Equal, className: "text-amber-400", label: "Medium priority" },
  LOW: { icon: ChevronDown, className: "text-sky-400", label: "Low priority" },
  NONE: { icon: Minus, className: "text-muted-foreground", label: "No priority" },
};

export function PriorityIcon({ priority, className }: { priority: Priority; className?: string }) {
  const { icon: Icon, className: colorClassName, label } = PRIORITY_CONFIG[priority];
  return (
    <span title={label} className="inline-flex">
      <Icon aria-label={label} className={cn("size-4", colorClassName, className)} />
    </span>
  );
}
