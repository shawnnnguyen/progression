import { useCallback, useMemo, useState } from "react";
import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragCancelEvent,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useAvailableTransitions } from "@/features/workflow/hooks/useAvailableTransitions";
import { useTransitionTicket } from "@/features/tickets/hooks/useTransitionTicket";
import type { TicketRow } from "@/features/tickets/types";
import type { WorkflowState } from "@/features/workflow/types";

/**
 * Orchestrates the board's drag-and-drop: sensors, the ticket currently being
 * dragged, which columns are legal drop targets for it (styling only — the
 * server remains the source of truth on drop), and screen-reader
 * announcements now that dragging is the only way to transition a ticket
 * (MoveToMenu was removed).
 */
export function useBoardDragAndDrop(projectId: string, tickets: TicketRow[], states: WorkflowState[]) {
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);

  const ticketMap = useMemo(() => new Map(tickets.map((ticket) => [ticket.id, ticket])), [tickets]);
  const stateMap = useMemo(() => new Map(states.map((state) => [state.id, state])), [states]);

  const activeTicket = activeTicketId ? ticketMap.get(activeTicketId) : undefined;

  // `over.id` is either a column id (dropped on empty column space) or another
  // ticket's id (dropped on/near a card, now that cards are sortable drop
  // targets too) — resolve either shape down to the column it lands in.
  // useCallback'd (rather than a plain function) so its identity only changes
  // when ticketMap/stateMap do, keeping the announcements useMemo below stable.
  const resolveStateId = useCallback(
    (overId: string | undefined): string | undefined => {
      if (!overId) return undefined;
      if (stateMap.has(overId)) return overId;
      return ticketMap.get(overId)?.stateId;
    },
    [stateMap, ticketMap],
  );

  const { availableTransitions, isLoading: legalityLoading } = useAvailableTransitions(
    projectId,
    activeTicket?.stateId,
  );
  const legalStateIds = useMemo(() => {
    const ids = availableTransitions.map((transition) => transition.toState.id);
    // Dropping a card back into its own column is always a legal (no-op) move,
    // even though the transitions graph never contains a self-transition —
    // style it the same as any other legal target instead of dimming it.
    if (activeTicket) ids.push(activeTicket.stateId);
    return new Set(ids);
  }, [availableTransitions, activeTicket]);

  const transitionMutation = useTransitionTicket(projectId, {});

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor),
  );

  // Memoized so dnd-kit's internal accessibility monitor (which re-subscribes
  // its live region whenever this reference changes) doesn't tear down and
  // rebuild on every unrelated re-render (e.g. a background query refetch).
  const announcements: Announcements = useMemo(
    () => ({
      onDragStart({ active }) {
        const ticket = ticketMap.get(String(active.id));
        return ticket ? `Picked up ticket #${ticket.number}.` : undefined;
      },
      onDragOver({ active, over }) {
        const ticket = ticketMap.get(String(active.id));
        const stateId = over ? resolveStateId(String(over.id)) : undefined;
        const state = stateId ? stateMap.get(stateId) : undefined;
        return ticket && state ? `Ticket #${ticket.number} is over the ${state.name} column.` : undefined;
      },
      onDragEnd({ active, over }) {
        const ticket = ticketMap.get(String(active.id));
        if (!ticket) return undefined;
        const stateId = over ? resolveStateId(String(over.id)) : undefined;
        const state = stateId ? stateMap.get(stateId) : undefined;
        return state
          ? `Ticket #${ticket.number} was moved to ${state.name}.`
          : `Ticket #${ticket.number} move was cancelled.`;
      },
      onDragCancel({ active }) {
        const ticket = ticketMap.get(String(active.id));
        return ticket ? `Movement of ticket #${ticket.number} was cancelled.` : undefined;
      },
    }),
    [ticketMap, stateMap, resolveStateId],
  );

  function onDragStart(event: DragStartEvent) {
    setActiveTicketId(String(event.active.id));
  }

  function onDragEnd(event: DragEndEvent) {
    const ticket = activeTicket;
    setActiveTicketId(null);
    if (!ticket || !event.over) return;

    const toStateId = resolveStateId(String(event.over.id));
    if (!toStateId || toStateId === ticket.stateId) return;

    transitionMutation.mutate({ ticketId: ticket.id, toStateId, version: ticket.version });
  }

  function onDragCancel(_event: DragCancelEvent) {
    setActiveTicketId(null);
  }

  return {
    sensors,
    activeTicket,
    legalStateIds,
    legalityLoading,
    announcements,
    onDragStart,
    onDragEnd,
    onDragCancel,
  };
}
