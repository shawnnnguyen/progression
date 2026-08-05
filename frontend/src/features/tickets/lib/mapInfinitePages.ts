import type { TicketRow, TicketsResult } from "../types";

/** Patches one ticket in place across a capped multi-page result — the ticket can be on any page. */
export function mapInfinitePages(
  data: TicketsResult | undefined,
  ticketId: string,
  patch: Partial<TicketRow>,
): TicketsResult | undefined {
  if (!data) return data;

  const patchTicket = (ticket: TicketRow): TicketRow => (ticket.id === ticketId ? { ...ticket, ...patch } : ticket);

  return {
    ...data,
    pages: data.pages.map((page) => ({ ...page, data: page.data.map(patchTicket) })),
    tickets: data.tickets.map(patchTicket),
  };
}
