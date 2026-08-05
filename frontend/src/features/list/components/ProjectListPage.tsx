import { useMemo, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useProject } from "@/features/projects/hooks/useProject";
import { useProjectMemberMap } from "@/features/projects/hooks/useProjectMembers";
import { ProjectTopbar } from "@/features/projects/components/ProjectTopbar";
import { useWorkflowStateMap } from "@/features/workflow/hooks/useWorkflowStateMap";
import { useSprints } from "@/features/sprints/hooks/useSprints";
import { useLabels } from "@/features/labels/hooks/useLabels";
import { useProjectTickets } from "@/features/tickets/hooks/useProjectTickets";
import type { TicketFilters } from "@/features/tickets/types";
import { TicketFilterBar } from "./TicketFilterBar";
import { TicketTable } from "./TicketTable";
import { sortTickets, type SortOption } from "../lib/sortTickets";

export function ProjectListPage({ projectId }: { projectId: string }) {
  const [filters, setFilters] = useState<TicketFilters>({});
  const [sort, setSort] = useState<SortOption>("default");

  const projectQuery = useProject(projectId);
  const ticketsQuery = useProjectTickets(projectId, filters);
  const { memberMap, data: members } = useProjectMemberMap(projectId);
  const { stateMap, data: states } = useWorkflowStateMap(projectId);
  const { data: labels } = useLabels(projectId);
  const { data: sprints } = useSprints(projectId);

  const sortedTickets = useMemo(
    () => sortTickets(ticketsQuery.data?.tickets ?? [], sort),
    [ticketsQuery.data, sort],
  );

  if (projectQuery.isLoading || ticketsQuery.isLoading) {
    return (
      <div className="flex flex-col gap-3 p-6">
        <Skeleton className="h-8 w-64" />
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (projectQuery.isError || ticketsQuery.isError) {
    return (
      <div className="flex flex-col items-center gap-3 p-10 text-center text-muted-foreground">
        <p>Something went wrong loading this list.</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            projectQuery.refetch();
            ticketsQuery.refetch();
          }}
        >
          Try again
        </Button>
      </div>
    );
  }

  if (!projectQuery.data) return null;

  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <div className="flex h-full flex-col">
      <ProjectTopbar project={projectQuery.data} view="list" />
      <TicketFilterBar
        filters={filters}
        onFiltersChange={setFilters}
        states={states ?? []}
        members={members ?? []}
        labels={labels ?? []}
        sprints={sprints ?? []}
        sort={sort}
        onSortChange={setSort}
      />
      <div className="flex-1 overflow-y-auto p-6">
        {sortedTickets.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
            {hasActiveFilters ? (
              <>
                <p>No tickets match your filters</p>
                <button
                  type="button"
                  onClick={() => setFilters({})}
                  className="text-sm text-primary underline underline-offset-4"
                >
                  Clear all
                </button>
              </>
            ) : (
              <p>This project has no tickets yet</p>
            )}
          </div>
        ) : (
          <TicketTable tickets={sortedTickets} stateMap={stateMap} memberMap={memberMap} />
        )}
        {ticketsQuery.data?.isCapped && (
          <p className="mt-4 text-xs text-muted-foreground">
            Showing the first {ticketsQuery.data.tickets.length} tickets — this project has more.
          </p>
        )}
      </div>
    </div>
  );
}
