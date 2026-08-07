import { XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Label } from "@/features/labels/types";

export function LabelTag({
  label,
  className,
  onRemove,
}: {
  label: Label;
  className?: string;
  onRemove?: () => void;
}) {
  return (
    <span
      className={cn(
        "group/label-tag inline-flex items-center gap-2 rounded-md border border-[var(--color-divider)] px-2.5 py-1 text-sm",
        className,
      )}
      style={{ color: "color-mix(in srgb, var(--color-text) 72%, transparent)" }}
    >
      <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: label.color }} />
      {label.name}
      {onRemove && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
          }}
          aria-label={`Remove ${label.name} label`}
          className="hidden shrink-0 rounded-sm text-[var(--color-neutral-500)] outline-none hover:text-[var(--color-text)] group-hover/label-tag:inline-flex"
        >
          <XIcon className="size-3.5" />
        </button>
      )}
    </span>
  );
}
