import { cn } from "@/lib/utils";

export function ProjectKeyBadge({ projectKey, className }: { projectKey: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-[3px] bg-muted px-1 py-px text-[10px] tracking-wide text-[var(--color-neutral-400)] uppercase",
        className
      )}
    >
      {projectKey}
    </span>
  );
}
