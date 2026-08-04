export type WsEventName =
  | "ticket.created"
  | "ticket.updated"
  | "ticket.transitioned"
  | "ticket.assigned"
  | "comment.created"
  | "comment.updated"
  | "comment.deleted"
  | "sprint.updated";

export interface WsEvent {
  event: WsEventName;
  projectId: string;
  ticketId?: string;
  seq: number;
  data: Record<string, unknown>;
  actor: { userId: string; actorType: "user" };
  timestamp: string;
}

type Listener = (event: WsEvent) => void;

export class EventBus {
  private listeners = new Set<Listener>();
  private seqByProject = new Map<string, number>();

  private nextSeq(projectId: string): number {
    const next = (this.seqByProject.get(projectId) ?? 0) + 1;
    this.seqByProject.set(projectId, next);
    return next;
  }

  publish(event: Omit<WsEvent, "seq" | "timestamp">): WsEvent {
    const full: WsEvent = {
      ...event,
      seq: this.nextSeq(event.projectId),
      timestamp: new Date().toISOString(),
    };
    for (const listener of this.listeners) listener(full);
    return full;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
