import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useSprintsByProjectIds } from "@/features/sprints/hooks/useSprintsByProjectIds";
import type { ProjectRow } from "@/features/projects/types";
import type { Sprint } from "@/features/sprints/types";

// No aggregate exists for "all of a user's concurrently active sprints" —
// shows the first org project with an ACTIVE sprint, one card (product decision).
export function ActiveSprintCard({ projects }: { projects: ProjectRow[] }) {
  const projectIds = useMemo(() => projects.map((project) => project.id), [projects]);
  const sprintQueries = useSprintsByProjectIds(projectIds);

  const isLoading = sprintQueries.some((query) => query.isLoading);

  let match: { project: ProjectRow; sprint: Sprint } | null = null;
  for (let i = 0; i < projects.length; i++) {
    const activeSprint = sprintQueries[i]?.data?.find((sprint) => sprint.status === "ACTIVE");
    if (activeSprint) {
      match = { project: projects[i], sprint: activeSprint };
      break;
    }
  }

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Active sprint</h2>
      <Card className="gap-2 p-3">
        <CardContent className="flex flex-col gap-1 p-0">
          {isLoading ? (
            <span className="text-sm text-muted-foreground">Loading…</span>
          ) : match ? (
            <>
              <span className="text-sm font-medium">{match.sprint.name}</span>
              <span className="text-xs text-muted-foreground">{match.project.name}</span>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">No active sprint</span>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
