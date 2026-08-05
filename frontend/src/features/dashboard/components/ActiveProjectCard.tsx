import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectKeyBadge } from "@/features/projects/components/ProjectKeyBadge";
import { useProjectTicketsSummary } from "@/features/tickets/hooks/useProjectTicketsSummary";
import type { ProjectRow } from "@/features/projects/types";

export function ActiveProjectCard({ project }: { project: ProjectRow }) {
  const summary = useProjectTicketsSummary(project.id);
  const progress = summary.total > 0 ? Math.round((summary.doneCount / summary.total) * 100) : 0;

  return (
    <Card className="gap-2 p-3">
      <CardHeader className="p-0">
        <CardTitle className="flex items-center gap-2 text-sm">
          <ProjectKeyBadge projectKey={project.key} />
          {project.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1 p-0 text-xs text-muted-foreground">
        {summary.isLoading ? (
          <span>Loading…</span>
        ) : (
          <>
            <span>
              {summary.openCount} open{summary.isCapped ? " (approx.)" : ""}
            </span>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
