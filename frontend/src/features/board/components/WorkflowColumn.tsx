import { useMemo } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { StateDot } from "@/components/domain/StateDot";
import { DraggableTicketCard } from "./DraggableTicketCard";
import { cn } from "@/lib/utils";
import type { EffectiveProjectMember } from "@/features/projects/types";
import type { TicketRow } from "@/features/tickets/types";
import type { WorkflowState } from "@/features/workflow/types";

export function WorkflowColumn({
  state,
  tickets,
  memberMap,
  activeTicketId,
  legalStateIds,
  legalityLoading,
}: {
  state: WorkflowState;
  tickets: TicketRow[];
  memberMap: Map<string, EffectiveProjectMember>;
  activeTicketId: string | undefined;
  legalStateIds: Set<string>;
  legalityLoading: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: state.id });
  const ticketIds = useMemo(() => tickets.map((ticket) => ticket.id), [tickets]);
  const isDragging = activeTicketId !== undefined;
  const isLegal = legalStateIds.has(state.id);
  // While the workflow-transitions query is still in flight, legalStateIds is
  // necessarily empty — don't dim every column as "illegal" during that race.
  const isDimmed = isDragging && !isLegal && !legalityLoading;

  return (
    <div className="flex w-72 shrink-0 flex-col gap-3">
      <div className="flex items-center gap-2 px-1">
        <StateDot category={state.category} />
        <h2 className="text-sm font-semibold">{state.name}</h2>
        <span className="text-xs text-muted-foreground">{tickets.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex flex-col gap-2 rounded-md transition-colors",
          isDimmed && "opacity-50",
          isDragging && isLegal && !isOver && "ring-1 ring-primary/30",
          isDragging && isLegal && isOver && "bg-primary/5 ring-2 ring-primary",
        )}
      >
        {tickets.length === 0 && <p className="px-1 text-xs text-muted-foreground">No tickets</p>}
        <SortableContext items={ticketIds} strategy={verticalListSortingStrategy}>
          {tickets.map((ticket) => (
            <DraggableTicketCard
              key={ticket.id}
              ticket={ticket}
              assignee={ticket.assigneeId ? memberMap.get(ticket.assigneeId) : undefined}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
