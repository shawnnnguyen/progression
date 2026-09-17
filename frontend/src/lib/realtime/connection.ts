import { env } from "@/config/env";
import { getAccessToken } from "../authToken";
import { queryClient } from "../query-client";

type WsEventName =
  | "ticket.created"
  | "ticket.updated"
  | "ticket.transitioned"
  | "ticket.assigned"
  | "comment.created"
  | "comment.updated"
  | "comment.deleted"
  | "sprint.updated";

interface WsEvent {
  event: WsEventName;
  projectId: string;
  ticketId?: string;
  seq: number;
  data: Record<string, unknown>;
  actor: { userId: string; actorType: "user" };
  timestamp: string;
}

function isWsEvent(message: unknown): message is WsEvent {
  return typeof message === "object" && message !== null && "event" in message && "projectId" in message;
}

function wsUrl(): string {
  return `${env.apiUrl.replace(/^http/, "ws")}/api/v1/ws`;
}

function invalidate(queryKey: unknown[]) {
  queryClient.invalidateQueries({ queryKey, refetchType: "active" });
}

function handleEvent({ event, projectId, ticketId }: WsEvent) {
  switch (event) {
    case "ticket.created":
    case "ticket.updated":
    case "ticket.transitioned":
    case "ticket.assigned":
      invalidate(["projects", projectId, "tickets"]);
      invalidate(["me", "tickets"]);
      if (ticketId) invalidate(["tickets", ticketId, "events"]);
      break;
    case "comment.created":
    case "comment.updated":
    case "comment.deleted":
      if (ticketId) {
        invalidate(["tickets", ticketId, "comments"]);
        invalidate(["tickets", ticketId, "events"]);
      }
      break;
    case "sprint.updated":
      invalidate(["projects", projectId, "sprints"]);
      break;
  }
}

const RECONNECT_BASE_DELAY_MS = 1000;
const RECONNECT_MAX_DELAY_MS = 15_000;

let socket: WebSocket | null = null;
let authenticated = false;
let manuallyClosed = true;
let reconnectAttempt = 0;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
const subscriptions = new Map<string, number>();

function send(message: Record<string, unknown>) {
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  }
}

function resubscribeAll() {
  for (const projectId of subscriptions.keys()) {
    send({ action: "subscribe", projectId });
  }
}

function scheduleReconnect() {
  if (manuallyClosed || reconnectTimer) return;
  const delay = Math.min(RECONNECT_BASE_DELAY_MS * 2 ** reconnectAttempt, RECONNECT_MAX_DELAY_MS);
  reconnectAttempt += 1;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, delay);
}

function connect() {
  if (manuallyClosed || socket) return;
  const token = getAccessToken();
  if (!token) return;

  const ws = new WebSocket(wsUrl());
  socket = ws;
  authenticated = false;

  ws.onopen = () => {
    ws.send(JSON.stringify({ action: "auth", token }));
  };

  ws.onmessage = (event: MessageEvent<string>) => {
    let message: unknown;
    try {
      message = JSON.parse(event.data);
    } catch {
      return;
    }
    if (!message || typeof message !== "object") return;

    if ("authenticated" in message) {
      authenticated = true;
      reconnectAttempt = 0;
      resubscribeAll();
      return;
    }

    if (isWsEvent(message)) {
      handleEvent(message);
    }
  };

  ws.onclose = () => {
    socket = null;
    authenticated = false;
    scheduleReconnect();
  };

  ws.onerror = () => {
    ws.close();
  };
}

export function startRealtime() {
  manuallyClosed = false;
  reconnectAttempt = 0;
  connect();
}

export function stopRealtime() {
  manuallyClosed = true;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  subscriptions.clear();
  socket?.close();
  socket = null;
  authenticated = false;
}

export function subscribeToProject(projectId: string): () => void {
  const count = subscriptions.get(projectId) ?? 0;
  subscriptions.set(projectId, count + 1);
  if (count === 0 && authenticated) send({ action: "subscribe", projectId });

  let released = false;
  return () => {
    if (released) return;
    released = true;
    const current = subscriptions.get(projectId) ?? 0;
    if (current <= 1) {
      subscriptions.delete(projectId);
      if (authenticated) send({ action: "unsubscribe", projectId });
    } else {
      subscriptions.set(projectId, current - 1);
    }
  };
}
