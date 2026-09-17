import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface ActionMenuItem {
  label: string;
  onClick: () => void;
  variant?: "default" | "destructive";
  disabled?: boolean;
}

export function ActionMenu({
  items,
  align = "end",
  ariaLabel = "Actions",
  className,
}: {
  items: ActionMenuItem[];
  align?: "start" | "center" | "end";
  ariaLabel?: string;
  className?: string;
}) {
  if (items.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={ariaLabel}
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-md text-[var(--color-neutral-500)] outline-none hover:bg-[var(--color-bg)] hover:text-[var(--color-text)] data-popup-open:bg-[var(--color-bg)] data-popup-open:text-[var(--color-text)]",
          className,
        )}
      >
        <MoreHorizontal className="size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align}>
        {items.map((item) => (
          <DropdownMenuItem key={item.label} variant={item.variant} disabled={item.disabled} onClick={item.onClick}>
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
