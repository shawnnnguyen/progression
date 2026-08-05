import type { Priority, TicketRow } from "@/features/tickets/types";

const PRIORITY_RANK: Record<Priority, number> = { NONE: 0, LOW: 1, MEDIUM: 2, HIGH: 3, URGENT: 4 };

export type SortOption = "default" | "priority-desc" | "priority-asc" | "updated-desc";

/** No server-side sort param (backend gap) — sorted client-side after the page fetches. */
export function sortTickets(tickets: TicketRow[], sort: SortOption): TicketRow[] {
  if (sort === "default") return tickets;

  const sorted = [...tickets];
  switch (sort) {
    case "priority-desc":
      sorted.sort((a, b) => PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority]);
      break;
    case "priority-asc":
      sorted.sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);
      break;
    case "updated-desc":
      sorted.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      break;
  }
  return sorted;
}
