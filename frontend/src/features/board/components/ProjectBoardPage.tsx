import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { DndContext, DragOverlay, closestCenter } from "@dnd-kit/core";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useProject } from "@/features/projects/hooks/useProject";
import { useProjectMemberMap } from "@/features/projects/hooks/useProjectMembers";
import { ProjectTopbar } from "@/features/projects/components/ProjectTopbar";
import { useWorkflowStates } from "@/features/workflow/hooks/useWorkflowStates";
import { useSprints } from "@/features/sprints/hooks/useSprints";
import { useLabels } from "@/features/labels/hooks/useLabels";
import { useProjectTickets } from "@/features/tickets/hooks/useProjectTickets";
import { TicketCard } from "@/features/tickets/components/TicketCard";
import { TicketDetailSheet } from "@/features/tickets/components/TicketDetailSheet";
import { TicketFilterBar } from "@/features/list/components/TicketFilterBar";
import { sortTickets, type SortOption } from "@/features/list/lib/sortTickets";
import type { TicketFilters, TicketRow } from "@/features/tickets/types";
import { useBoardDragAndDrop } from "../hooks/useBoardDragAndDrop";
import { BoardColumns } from "./BoardColumns";

export function ProjectBoardPage({ projectId }: { projectId: string }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const openTicketNumber = searchParams.get("ticket");

  // The `sprint` URL param only seeds the initial filter (e.g. arriving via a sprint
  // card's link) — from here on filtering is local state, same as the list view.
  const [filters, setFilters] = useState<TicketFilters>(() => {
    const sprint = searchParams.get("sprint");
    return sprint ? { sprint } : {};
  });
  const [sort, setSort] = useState<SortOption>("default");

  const projectQuery = useProject(projectId);
  const statesQuery = useWorkflowStates(projectId);
  const ticketsQuery = useProjectTickets(projectId, filters);
  const { memberMap, data: members } = useProjectMemberMap(projectId);
  const { data: labels } = useLabels(projectId);
  const { data: sprints } = useSprints(projectId);

  function openTicket(ticket: TicketRow) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("ticket", String(ticket.number));
      return next;
    });
  }

  function closeTicket() {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("ticket");
      return next;
    });
  }

  const sortedTickets = useMemo(
    () => sortTickets(ticketsQuery.data?.tickets ?? [], sort),
    [ticketsQuery.data, sort],
  );

  const {
    sensors,
    activeTicket,
    legalStateIds,
    legalityLoading,
    announcements,
    onDragStart,
    onDragEnd,
    onDragCancel,
  } = useBoardDragAndDrop(projectId, sortedTickets, statesQuery.data ?? []);

  if (projectQuery.isLoading || statesQuery.isLoading || ticketsQuery.isLoading) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <Skeleton className="h-8 w-64" />
        <div className="flex gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-96 flex-1" />
          ))}
        </div>
      </div>
    );
  }

  if (projectQuery.isError || statesQuery.isError || ticketsQuery.isError) {
    return (
      <div className="flex flex-col items-center gap-3 p-10 text-center text-muted-foreground">
        <p>Something went wrong loading this board.</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            projectQuery.refetch();
            statesQuery.refetch();
            ticketsQuery.refetch();
          }}
        >
          Try again
        </Button>
      </div>
    );
  }

  if (!projectQuery.data || !statesQuery.data || !ticketsQuery.data) return null;

  return (
    <div className="flex h-full flex-col">
      <ProjectTopbar project={projectQuery.data} view="board" />
      <TicketFilterBar
        filters={filters}
        onFiltersChange={setFilters}
        states={statesQuery.data}
        members={members ?? []}
        labels={labels ?? []}
        sprints={sprints ?? []}
        sort={sort}
        onSortChange={setSort}
      />
      <div className="flex-1 overflow-x-auto py-6 pl-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          accessibility={{ announcements }}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDragCancel={onDragCancel}
        >
          <BoardColumns
            project={projectQuery.data}
            states={statesQuery.data}
            tickets={sortedTickets}
            memberMap={memberMap}
            activeTicketId={activeTicket?.id}
            legalStateIds={legalStateIds}
            legalityLoading={legalityLoading}
            projectKey={projectQuery.data.key}
            onOpenTicket={openTicket}
          />
          <DragOverlay dropAnimation={null}>
            {activeTicket && (
              <TicketCard
                ticket={activeTicket}
                assignee={activeTicket.assigneeId ? memberMap.get(activeTicket.assigneeId) : undefined}
                projectKey={projectQuery.data.key}
              />
            )}
          </DragOverlay>
        </DndContext>
        {ticketsQuery.data.isCapped && (
          <p className="mt-4 text-xs text-muted-foreground">
            Showing the first {ticketsQuery.data.tickets.length} tickets — this project has more.
          </p>
        )}
      </div>
      {openTicketNumber && !Number.isNaN(Number(openTicketNumber)) && (
        <TicketDetailSheet
          projectId={projectId}
          projectKey={projectQuery.data.key}
          ticketNumber={Number(openTicketNumber)}
          onClose={closeTicket}
        />
      )}
    </div>
  );
}
