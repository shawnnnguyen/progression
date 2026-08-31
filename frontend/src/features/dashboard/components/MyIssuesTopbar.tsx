import { ChevronDown } from "lucide-react";
import { PageTopbar } from "@/components/layout/PageTopbar";

export function MyIssuesTopbar() {
  return (
    <PageTopbar
      left={<h1 className="font-heading text-sm font-semibold">My Issues</h1>}
      right={
        <span className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground">
          Grouped by state
          <ChevronDown className="size-3" />
        </span>
      }
    />
  );
}
