import { cn } from "@/lib/utils";

export function fieldTriggerClassName(compact: boolean | undefined, className?: string) {
  return cn(
    "flex items-center gap-1.5 rounded-md border border-[var(--color-divider)] bg-[var(--color-bg)] text-sm text-[var(--color-text)] outline-none transition-colors hover:bg-[var(--color-surface)] data-popup-open:bg-[var(--color-surface)] disabled:cursor-not-allowed disabled:opacity-50",
    compact ? "h-8 px-2 text-sm" : "w-full px-2 py-1.5",
    className,
  );
}

export const FIELD_LABEL_CLASSNAME = "text-xs text-[var(--color-neutral-500)]";

export function fieldInputClassName(className?: string) {
  return cn(
    "w-full rounded-md border border-[var(--color-divider)] bg-[var(--color-bg)] px-2 py-1.5 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-neutral-500)] focus:border-[var(--color-neutral-400)]",
    className,
  );
}
