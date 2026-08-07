import { useMemo } from "react";
import { useComments } from "./useComments";
import { useTicketEvents } from "./useTicketEvents";
import type { CommentRow, TicketEventRow } from "../types";

export type ActivityFeedItem =
  | { kind: "event"; id: string; createdAt: string; event: TicketEventRow }
  | { kind: "comment"; id: string; createdAt: string; comment: CommentRow };

const RECENT_ITEM_LIMIT = 5;

export function useActivityFeed(ticketId: string | undefined) {
  const eventsQuery = useTicketEvents(ticketId);
  const commentsQuery = useComments(ticketId);

  const items = useMemo(() => {
    const events = (eventsQuery.data ?? [])
      .filter((event) => event.type !== "COMMENTED")
      .map((event): ActivityFeedItem => ({ kind: "event", id: event.id, createdAt: event.createdAt, event }));

    const comments = (commentsQuery.data ?? []).map(
      (comment): ActivityFeedItem => ({ kind: "comment", id: comment.id, createdAt: comment.createdAt, comment }),
    );

    const sorted = [...events, ...comments].sort((a, b) => {
      const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return diff !== 0 ? diff : a.id.localeCompare(b.id);
    });

    return sorted.slice(-RECENT_ITEM_LIMIT);
  }, [eventsQuery.data, commentsQuery.data]);

  return {
    items,
    isLoading: eventsQuery.isLoading || commentsQuery.isLoading,
    isError: eventsQuery.isError || commentsQuery.isError,
  };
}
