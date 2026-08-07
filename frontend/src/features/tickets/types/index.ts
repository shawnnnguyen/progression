import type { Label } from "@/features/labels/types";

export type Priority = "NONE" | "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface TicketRow {
  id: string;
  projectId: string;
  number: number;
  title: string;
  description: string | null;
  priority: Priority;
  stateId: string;
  assigneeId: string | null;
  reporterId: string;
  sprintId: string | null;
  version: number;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  labels: Label[];
}

export interface TicketFilters {
  state?: string;
  assignee?: string;
  label?: string;
  sprint?: string;
  q?: string;
  updatedSince?: string;
}

export interface TicketsPage {
  data: TicketRow[];
  nextCursor: string | null;
}

export type TicketEventType =
  | "CREATED"
  | "TITLE_CHANGED"
  | "DESCRIPTION_CHANGED"
  | "STATE_CHANGED"
  | "PRIORITY_CHANGED"
  | "ASSIGNED"
  | "UNASSIGNED"
  | "LABEL_ADDED"
  | "LABEL_REMOVED"
  | "SPRINT_CHANGED"
  | "COMMENTED";

export interface TicketEventRow {
  id: string;
  ticketId: string;
  type: TicketEventType;
  data: Record<string, unknown>;
  schemaVersion: number;
  actorUserId: string;
  createdAt: string;
}

export interface TicketEventsPage {
  data: TicketEventRow[];
  nextCursor: string | null;
}

export interface CommentRow {
  id: string;
  ticketId: string;
  authorId: string;
  body: string;
  editedAt: string | null;
  createdAt: string;
}

export interface CommentsPage {
  data: CommentRow[];
  nextCursor: string | null;
}

export interface TicketPatchInput {
  version: number;
  title?: string;
  description?: string | null;
  priority?: Priority;
  assigneeId?: string | null;
  sprintId?: string | null;
  labelIds?: string[];
}

export interface TicketsResult {
  pages: TicketsPage[];
  tickets: TicketRow[];
  isCapped: boolean;
}
