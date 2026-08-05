import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TicketCard } from "@/features/tickets/components/TicketCard";
import { cn } from "@/lib/utils";
import type { EffectiveProjectMember } from "@/features/projects/types";
import type { TicketRow } from "@/features/tickets/types";

export function DraggableTicketCard({
  ticket,
  assignee,
}: {
  ticket: TicketRow;
  assignee: EffectiveProjectMember | undefined;
}) {
  const { setNodeRef, listeners, attributes, transform, transition, isDragging } = useSortable({ id: ticket.id });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      // Hidden (not unmounted, so layout space is preserved and the column
      // doesn't reflow) while this card is the one being dragged — DragOverlay
      // renders the visible floating copy, so this avoids a doubled-up card
      // effect during the drag.
      className={cn("cursor-grab touch-none active:cursor-grabbing", isDragging && "opacity-0")}
    >
      <TicketCard ticket={ticket} assignee={assignee} />
    </div>
  );
}
