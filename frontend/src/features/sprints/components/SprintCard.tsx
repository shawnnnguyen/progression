import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useSprintTicketsSummary } from "@/features/tickets/hooks/useSprintTicketsSummary";
import { formatDateOnly } from "@/features/tickets/lib/formatTimestamp";
import { daysBetween } from "../lib/sprintDates";
import type { Sprint } from "../types";

const STATUS_LABEL: Record<Sprint["status"], string> = {
  PLANNED: "Planned",
  ACTIVE: "Active",
  COMPLETED: "Completed",
};

export function SprintCard({ projectId, sprint }: { projectId: string; sprint: Sprint }) {
  const summary = useSprintTicketsSummary(projectId, sprint.id);
  const now = new Date();

  const rightSideText =
    sprint.status === "ACTIVE"
      ? `${summary.remainingCount} remaining · ends ${formatDateOnly(sprint.endDate)}`
      : sprint.status === "PLANNED"
        ? `Starts in ${Math.max(0, daysBetween(now, new Date(sprint.startDate)))} days`
        : null;

  const progress = summary.total > 0 ? Math.round((summary.doneCount / summary.total) * 100) : 0;
  const breakdownText = summary.breakdown.map((entry) => `${entry.count} ${entry.name.toLowerCase()}`).join(" · ");
  const isActive = sprint.status === "ACTIVE";

  const card = (
    <Card className={cn("gap-2 p-4", isActive && "transition-colors hover:ring-1 hover:ring-primary")}>
      <CardContent className="flex flex-col gap-2 p-0">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-[var(--color-text)]">{sprint.name}</span>
            <Badge variant={isActive ? "default" : "outline"}>{STATUS_LABEL[sprint.status]}</Badge>
            <span className="text-xs text-[var(--color-neutral-500)]">
              {formatDateOnly(sprint.startDate)} – {formatDateOnly(sprint.endDate)}
              {isActive && ` · ${Math.max(0, daysBetween(now, new Date(sprint.endDate)))} days left`}
            </span>
          </div>
          {rightSideText && <span className="shrink-0 text-xs text-[var(--color-neutral-500)]">{rightSideText}</span>}
        </div>

        <p className="text-sm text-[var(--color-text)]">{sprint.goal ? `Goal: ${sprint.goal}` : "No goal set."}</p>

        {!summary.isLoading && (
          <>
            <span className="text-xs text-[var(--color-neutral-500)]">
              {summary.total} {summary.total === 1 ? "ticket" : "tickets"}
              {breakdownText && ` · ${breakdownText}`}
            </span>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );

  if (!isActive) return card;

  return (
    <Link to={`/projects/${projectId}/board?sprint=${sprint.id}`} className="block rounded-xl">
      {card}
    </Link>
  );
}
