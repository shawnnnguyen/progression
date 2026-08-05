import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function ProjectKeyBadge({ projectKey, className }: { projectKey: string; className?: string }) {
  return (
    <Badge variant="outline" className={cn("font-mono uppercase tracking-wide", className)}>
      {projectKey}
    </Badge>
  );
}
