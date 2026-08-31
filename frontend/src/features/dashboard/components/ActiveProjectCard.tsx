import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectKeyBadge } from "@/features/projects/components/ProjectKeyBadge";
import { useProjectTicketsSummary } from "@/features/tickets/hooks/useProjectTicketsSummary";
import type { ProjectRow } from "@/features/projects/types";

export function ActiveProjectCard({ project }: { project: ProjectRow }) {
  const summary = useProjectTicketsSummary(project.id);
  const progress = summary.total > 0 ? Math.round((summary.doneCount / summary.total) * 100) : 0;

  return (
    <Card className="gap-1.5 p-2.5">
      <CardHeader className="p-0">
        <CardTitle className="flex items-center justify-between gap-2 text-sm">
          <span className="flex items-center gap-2">
            <ProjectKeyBadge projectKey={project.key} />
            {project.name}
          </span>
          {!summary.isLoading && (
            <span className="text-xs font-normal text-muted-foreground">
              {summary.openCount} open{summary.isCapped ? " (approx.)" : ""}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {summary.isLoading ? (
          <span className="text-xs text-muted-foreground">Loading…</span>
        ) : (
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
