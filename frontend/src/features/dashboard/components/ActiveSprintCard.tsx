import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useSprintsByProjectIds } from "@/features/sprints/hooks/useSprintsByProjectIds";
import { daysBetween } from "@/features/sprints/lib/sprintDates";
import { useSprintTicketsSummary } from "@/features/tickets/hooks/useSprintTicketsSummary";
import { formatDateOnly } from "@/features/tickets/lib/formatTimestamp";
import type { ProjectRow } from "@/features/projects/types";
import type { Sprint } from "@/features/sprints/types";

function daysLeft(endDate: string): number {
  return Math.max(0, daysBetween(new Date(), new Date(endDate)));
}

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

  const summary = useSprintTicketsSummary(match?.project.id, match?.sprint.id);

  const card = (
    <Card className={cn("gap-2 p-3", match && "transition-colors hover:ring-1 hover:ring-primary")}>
      <CardContent className="flex flex-col gap-2 p-0">
        {isLoading ? (
          <span className="text-sm text-muted-foreground">Loading…</span>
        ) : match ? (
          <>
            <div className="flex items-center gap-2">
              <Badge>Active</Badge>
              <span className="text-xs text-muted-foreground">
                {formatDateOnly(match.sprint.startDate)} – {formatDateOnly(match.sprint.endDate)}
              </span>
            </div>
            {match.sprint.goal && <p className="text-sm">Goal: {match.sprint.goal}</p>}
            {!summary.isLoading && summary.total > 0 && (
              <>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${Math.round((summary.doneCount / summary.total) * 100)}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {summary.doneCount} of {summary.total} done · {daysLeft(match.sprint.endDate)} days left
                </span>
              </>
            )}
          </>
        ) : (
          <span className="text-sm text-muted-foreground">No active sprint</span>
        )}
      </CardContent>
    </Card>
  );

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {match ? `${match.sprint.name} · ${match.project.name}` : "Active sprint"}
      </h2>
      {match ? (
        <Link to={`/projects/${match.project.id}/board?sprint=${match.sprint.id}`} className="block rounded-xl">
          {card}
        </Link>
      ) : (
        card
      )}
    </section>
  );
}
