import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useProject } from "@/features/projects/hooks/useProject";
import { useSprints } from "../hooks/useSprints";
import { SprintsTopbar } from "./SprintsTopbar";
import { SprintCard } from "./SprintCard";
import type { Sprint } from "../types";

const STATUS_RANK: Record<Sprint["status"], number> = { ACTIVE: 0, PLANNED: 1, COMPLETED: 2 };

function sortSprints(sprints: Sprint[]): Sprint[] {
  return [...sprints].sort((a, b) => {
    const rankDiff = STATUS_RANK[a.status] - STATUS_RANK[b.status];
    if (rankDiff !== 0) return rankDiff;
    return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
  });
}

export function SprintsPage({ projectId }: { projectId: string }) {
  const projectQuery = useProject(projectId);
  const sprintsQuery = useSprints(projectId);

  const sortedSprints = useMemo(() => sortSprints(sprintsQuery.data ?? []), [sprintsQuery.data]);

  if (projectQuery.isLoading || sprintsQuery.isLoading) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <Skeleton className="h-8 w-64" />
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (projectQuery.isError || sprintsQuery.isError) {
    return (
      <div className="flex flex-col items-center gap-3 p-10 text-center text-muted-foreground">
        <p>Something went wrong loading sprints.</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            projectQuery.refetch();
            sprintsQuery.refetch();
          }}
        >
          Try again
        </Button>
      </div>
    );
  }

  if (!projectQuery.data) return null;

  return (
    <div className="flex h-full flex-col">
      <SprintsTopbar project={projectQuery.data} />
      <div className="flex flex-col gap-3 overflow-y-auto p-6">
        {sortedSprints.length === 0 ? (
          <p className="text-sm text-muted-foreground">No sprints yet.</p>
        ) : (
          sortedSprints.map((sprint) => <SprintCard key={sprint.id} projectId={projectId} sprint={sprint} />)
        )}
      </div>
    </div>
  );
}
