import { ChevronDownIcon, XIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface TicketFilterFieldOption {
  value: string;
  label: string;
}

export function TicketFilterField({
  label,
  value,
  activeLabel,
  anyLabel,
  options,
  onChange,
  ariaLabel,
}: {
  label: string;
  value: string;
  activeLabel?: string;
  anyLabel: string;
  options: TicketFilterFieldOption[];
  onChange: (value: string) => void;
  ariaLabel: string;
}) {
  const isActive = value !== "" && !!activeLabel;

  return (
    <div className="relative inline-flex">
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={ariaLabel}
          className={cn(
            "flex h-9 items-center gap-1.5 rounded-md border px-3 text-sm font-medium outline-none transition-colors",
            isActive
              ? "border-primary/40 bg-primary/10 pr-7 text-primary hover:bg-primary/15 data-popup-open:bg-primary/15"
              : "border-border bg-background text-foreground/80 hover:bg-muted data-popup-open:bg-muted",
          )}
        >
          {isActive ? (
            <span className="truncate">
              {label}: {activeLabel}
            </span>
          ) : (
            <>
              {label}
              <ChevronDownIcon className="size-3.5 shrink-0 text-muted-foreground" />
            </>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-40">
          <DropdownMenuRadioGroup value={value} onValueChange={(next) => onChange(next as string)}>
            <DropdownMenuRadioItem value="">{anyLabel}</DropdownMenuRadioItem>
            {options.map((option) => (
              <DropdownMenuRadioItem key={option.value} value={option.value}>
                {option.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      {isActive && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label={`Clear ${label} filter`}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-primary outline-none hover:bg-primary/20"
        >
          <XIcon className="size-3.5" />
        </button>
      )}
    </div>
  );
}
