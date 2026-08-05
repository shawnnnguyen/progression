import { cn } from "@/lib/utils";
import { stateCategoryStyles } from "@/features/workflow/lib/stateCategoryStyles";
import type { StateCategory } from "@/features/workflow/types";

export function StateDot({ category, className }: { category: StateCategory; className?: string }) {
  const style = stateCategoryStyles[category];
  return (
    <span
      title={style.label}
      aria-label={style.label}
      className={cn("inline-block size-2 shrink-0 rounded-full", style.dotClassName, className)}
    />
  );
}
