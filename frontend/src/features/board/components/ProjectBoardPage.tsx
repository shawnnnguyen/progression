import { DndContext, DragOverlay, closestCenter } from "@dnd-kit/core";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useProject } from "@/features/projects/hooks/useProject";
import { useProjectMemberMap } from "@/features/projects/hooks/useProjectMembers";
import { ProjectTopbar } from "@/features/projects/components/ProjectTopbar";
import { useWorkflowStates } from "@/features/workflow/hooks/useWorkflowStates";
import { useProjectTickets } from "@/features/tickets/hooks/useProjectTickets";
import { TicketCard } from "@/features/tickets/components/TicketCard";
import { useBoardDragAndDrop } from "../hooks/useBoardDragAndDrop";
import { BoardColumns } from "./BoardColumns";

export function ProjectBoardPage({ projectId }: { projectId: string }) {
  const projectQuery = useProject(projectId);
  const statesQuery = useWorkflowStates(projectId);
  const ticketsQuery = useProjectTickets(projectId, {});
  const { memberMap } = useProjectMemberMap(projectId);

  // Called unconditionally, above the loading/error early returns below, so
  // hook call order never changes between renders (Rules of Hooks) — it's
  // safe to call before data has loaded since drag handlers simply won't
  // fire until the board itself is rendered.
  const {
    sensors,
    activeTicket,
    legalStateIds,
    legalityLoading,
    announcements,
    onDragStart,
    onDragEnd,
    onDragCancel,
  } = useBoardDragAndDrop(projectId, ticketsQuery.data?.tickets ?? [], statesQuery.data ?? []);

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
      <div className="flex-1 overflow-x-auto p-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          accessibility={{ announcements }}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDragCancel={onDragCancel}
        >
          <BoardColumns
            states={statesQuery.data}
            tickets={ticketsQuery.data.tickets}
            memberMap={memberMap}
            activeTicketId={activeTicket?.id}
            legalStateIds={legalStateIds}
            legalityLoading={legalityLoading}
          />
          {/*
            Default drop animation is disabled: it animates the overlay back
            toward the dragged card's pre-drop position, which — since the
            optimistic cache patch lands on a later microtask than the drop
            itself — is still the OLD column at that instant. Without this,
            the overlay visibly snaps back to the old column and lingers
            there before disappearing, right as the real card jumps to the
            new one. Disabling it makes the overlay vanish the instant the
            drop happens instead.
          */}
          <DragOverlay dropAnimation={null}>
            {activeTicket && (
              <TicketCard
                ticket={activeTicket}
                assignee={activeTicket.assigneeId ? memberMap.get(activeTicket.assigneeId) : undefined}
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
    </div>
  );
}
