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

/** Flattened result of the capped eager-pagination loop — see useProjectTickets. */
export interface TicketsResult {
  pages: TicketsPage[];
  tickets: TicketRow[];
  isCapped: boolean;
}
