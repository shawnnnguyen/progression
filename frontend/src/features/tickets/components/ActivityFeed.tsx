import { useState } from "react";
import { UserAvatar } from "@/components/domain/UserAvatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { EffectiveProjectMember } from "@/features/projects/types";
import { useActivityFeed, type ActivityFeedItem } from "../hooks/useActivityFeed";
import { useEventDescriptionContext } from "../hooks/useEventDescriptionContext";
import { useTicketEventsInfinite } from "../hooks/useTicketEventsInfinite";
import type { CommentRow, TicketEventRow } from "../types";
import { EventDescription, type EventDescriptionContext } from "./EventDescription";
import { formatEventTimestamp, formatTimeOnly } from "../lib/formatTimestamp";
import { TicketMarkdown } from "./TicketMarkdown";

type FeedContext = EventDescriptionContext;

export function EventLine({ event, ctx }: { event: TicketEventRow; ctx: FeedContext }) {
  const actor = ctx.memberMap.get(event.actorUserId);
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
        <UserAvatar userId={event.actorUserId} name={actor?.name} avatarUrl={actor?.avatarUrl} size="sm" />
        <span className="font-medium text-[var(--color-text)]">{actor?.name ?? "Unknown"}</span>
        <EventDescription event={event} ctx={ctx} />
      </div>
      <span className="shrink-0 pt-0.5 text-xs text-[var(--color-neutral-500)]">{formatEventTimestamp(event.createdAt)}</span>
    </div>
  );
}

export function CommentCard({
  comment,
  memberMap,
}: {
  comment: CommentRow;
  memberMap: Map<string, EffectiveProjectMember>;
}) {
  const author = memberMap.get(comment.authorId);
  return (
    <div className="rounded-md bg-[var(--color-surface)] p-2.5">
      <div className="flex items-center gap-2 text-xs text-[var(--color-neutral-500)]">
        <UserAvatar userId={comment.authorId} name={author?.name} avatarUrl={author?.avatarUrl} size="sm" />
        <span className="font-medium text-[var(--color-text)]">{author?.name ?? "Unknown"}</span>
        <span>{formatEventTimestamp(comment.createdAt)}</span>
        {comment.editedAt && <span>· edited {formatTimeOnly(comment.editedAt)}</span>}
      </div>
      <TicketMarkdown content={comment.body} className="mt-1.5" />
    </div>
  );
}

function FeedList({ items, ctx }: { items: ActivityFeedItem[]; ctx: FeedContext }) {
  if (items.length === 0) {
    return <p className="py-4 text-sm text-[var(--color-neutral-500)]">Nothing here yet.</p>;
  }
  return (
    <div className="flex flex-col gap-4">
      {items.map((item) =>
        item.kind === "event" ? (
          <EventLine key={`event-${item.id}`} event={item.event} ctx={ctx} />
        ) : (
          <div key={`comment-${item.id}`}>
            <CommentCard comment={item.comment} memberMap={ctx.memberMap} />
          </div>
        ),
      )}
    </div>
  );
}

const ACTIVITY_LABEL = (
  <h2 className="shrink-0 text-xs font-medium tracking-wide text-[var(--color-neutral-500)] uppercase">Activity</h2>
);

function PaginatedEventList({ ticketId, projectId }: { ticketId: string; projectId: string }) {
  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } = useTicketEventsInfinite(ticketId);
  const ctx = useEventDescriptionContext(projectId);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {ACTIVITY_LABEL}
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-2/3" />
      </div>
    );
  }

  // Pages arrive newest-first; flatten keeps that order, then reverse once for oldest-first display.
  const events = (data?.pages ?? [])
    .flatMap((page) => page.data)
    .filter((event) => event.type !== "COMMENTED")
    .reverse();

  return (
    <div className="flex flex-col gap-2">
      {ACTIVITY_LABEL}
      {hasNextPage && (
        <Button variant="outline" size="sm" disabled={isFetchingNextPage} onClick={() => fetchNextPage()}>
          {isFetchingNextPage ? "Loading…" : "Load older activity"}
        </Button>
      )}
      {events.length === 0 ? (
        <p className="py-4 text-sm text-[var(--color-neutral-500)]">Nothing here yet.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {events.map((event) => (
            <EventLine key={event.id} event={event} ctx={ctx} />
          ))}
        </div>
      )}
    </div>
  );
}

export function ActivityFeed({
  ticketId,
  projectId,
  showTabs = true,
  includeComments = true,
  paginated = false,
}: {
  ticketId: string;
  projectId: string;
  showTabs?: boolean;
  includeComments?: boolean;
  paginated?: boolean;
}) {
  if (paginated) {
    return <PaginatedEventList ticketId={ticketId} projectId={projectId} />;
  }
  return (
    <MergedActivityFeed
      ticketId={ticketId}
      projectId={projectId}
      showTabs={showTabs}
      includeComments={includeComments}
    />
  );
}

function MergedActivityFeed({
  ticketId,
  projectId,
  showTabs,
  includeComments,
}: {
  ticketId: string;
  projectId: string;
  showTabs: boolean;
  includeComments: boolean;
}) {
  const ctx = useEventDescriptionContext(projectId);
  const { items, isLoading } = useActivityFeed(ticketId, { includeComments });
  const [tab, setTab] = useState<"all" | "comments">("all");

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {ACTIVITY_LABEL}
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-2/3" />
      </div>
    );
  }

  const commentItems = items.filter((item) => item.kind === "comment");

  if (!showTabs || !includeComments) {
    return (
      <div className="flex flex-col gap-2">
        {ACTIVITY_LABEL}
        <FeedList items={items} ctx={ctx} />
      </div>
    );
  }

  return (
    <Tabs value={tab} onValueChange={(value) => setTab(value as "all" | "comments")}>
      <div className="flex items-center gap-3">
        {ACTIVITY_LABEL}
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="comments">Comments</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="all" className="pt-2">
        <FeedList items={items} ctx={ctx} />
      </TabsContent>
      <TabsContent value="comments" className="pt-2">
        <FeedList items={commentItems} ctx={ctx} />
      </TabsContent>
    </Tabs>
  );
}
