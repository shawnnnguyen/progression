import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TicketCard } from "@/features/tickets/components/TicketCard";
import { cn } from "@/lib/utils";
import type { EffectiveProjectMember } from "@/features/projects/types";
import type { TicketRow } from "@/features/tickets/types";

export function DraggableTicketCard({
  ticket,
  assignee,
  projectKey,
  onOpen,
}: {
  ticket: TicketRow;
  assignee: EffectiveProjectMember | undefined;
  projectKey: string;
  onOpen?: (ticket: TicketRow) => void;
}) {
  const { setNodeRef, listeners, attributes, transform, transition, isDragging } = useSortable({ id: ticket.id });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn("touch-none", isDragging && "opacity-0")}
    >
    
      <TicketCard
        ticket={ticket}
        assignee={assignee}
        projectKey={projectKey}
        onOpen={onOpen && !isDragging ? onOpen : undefined}
      />
    </div>
  );
}
