import type { TicketsPage, TicketsResult } from "../types";

const MAX_PAGES = 10;
export const TICKETS_PAGE_LIMIT = 200;

/**
 * Eagerly walks up to MAX_PAGES cursor pages inside the query function itself
 * (not via useEffect + fetchNextPage) since none of B1/B2/B3 have a "load more"
 * UI yet — see the implementation plan's data-fetching section for why an
 * effect-driven loop was rejected here.
 */
export async function fetchAllPages(fetchPage: (cursor: string | undefined) => Promise<TicketsPage>): Promise<TicketsResult> {
  const pages: TicketsPage[] = [];
  let cursor: string | undefined;

  for (let i = 0; i < MAX_PAGES; i++) {
    const page = await fetchPage(cursor);
    pages.push(page);
    if (!page.nextCursor) {
      return { pages, tickets: pages.flatMap((p) => p.data), isCapped: false };
    }
    cursor = page.nextCursor;
  }

  return { pages, tickets: pages.flatMap((p) => p.data), isCapped: true };
}
