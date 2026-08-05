import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function FilterChip({
  label,
  onRemove,
  className,
}: {
  label: string;
  onRemove?: () => void;
  className?: string;
}) {
  return (
    <Badge variant="secondary" className={cn("gap-1 pr-1", className)}>
      {label}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove filter: ${label}`}
          className="rounded-full p-0.5 hover:bg-foreground/10"
        >
          <X className="size-3" />
        </button>
      )}
    </Badge>
  );
}
