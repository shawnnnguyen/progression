import { useState } from "react";
import { UserAvatar } from "@/components/domain/UserAvatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProjectMemberMap } from "@/features/projects/hooks/useProjectMembers";
import { useWorkflowStates } from "@/features/workflow/hooks/useWorkflowStates";
import { useSprints } from "@/features/sprints/hooks/useSprints";
import { useLabels } from "@/features/labels/hooks/useLabels";
import { useActivityFeed, type ActivityFeedItem } from "../hooks/useActivityFeed";
import { EventDescription, type EventDescriptionContext } from "./EventDescription";
import { formatEventTimestamp, formatTimeOnly } from "../lib/formatTimestamp";
import { TicketMarkdown } from "./TicketMarkdown";

type FeedContext = EventDescriptionContext;

function EventLine({ item, ctx }: { item: Extract<ActivityFeedItem, { kind: "event" }>; ctx: FeedContext }) {
  const actor = ctx.memberMap.get(item.event.actorUserId);
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
        <UserAvatar userId={item.event.actorUserId} name={actor?.name} avatarUrl={actor?.avatarUrl} size="sm" />
        <span className="font-medium text-[var(--color-text)]">{actor?.name ?? "Unknown"}</span>
        <EventDescription event={item.event} ctx={ctx} />
      </div>
      <span className="shrink-0 pt-0.5 text-xs text-[var(--color-neutral-500)]">{formatEventTimestamp(item.createdAt)}</span>
    </div>
  );
}

function CommentCard({ item, ctx }: { item: Extract<ActivityFeedItem, { kind: "comment" }>; ctx: FeedContext }) {
  const author = ctx.memberMap.get(item.comment.authorId);
  return (
    <div className="rounded-md bg-[var(--color-surface)] p-2.5">
      <div className="flex items-center gap-2 text-xs text-[var(--color-neutral-500)]">
        <UserAvatar userId={item.comment.authorId} name={author?.name} avatarUrl={author?.avatarUrl} size="sm" />
        <span className="font-medium text-[var(--color-text)]">{author?.name ?? "Unknown"}</span>
        <span>{formatEventTimestamp(item.createdAt)}</span>
        {item.comment.editedAt && <span>· edited {formatTimeOnly(item.comment.editedAt)}</span>}
      </div>
      <TicketMarkdown content={item.comment.body} className="mt-1.5" />
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
          <EventLine key={`event-${item.id}`} item={item} ctx={ctx} />
        ) : (
          <div key={`comment-${item.id}`}>
            <CommentCard item={item} ctx={ctx} />
          </div>
        ),
      )}
    </div>
  );
}

const ACTIVITY_LABEL = (
  <h2 className="shrink-0 text-xs font-medium tracking-wide text-[var(--color-neutral-500)] uppercase">Activity</h2>
);

export function ActivityFeed({
  ticketId,
  projectId,
  showTabs = true,
}: {
  ticketId: string;
  projectId: string;
  showTabs?: boolean;
}) {
  const { items, isLoading } = useActivityFeed(ticketId);
  const { memberMap } = useProjectMemberMap(projectId);
  const { data: states } = useWorkflowStates(projectId);
  const { data: sprints } = useSprints(projectId);
  const { data: labels } = useLabels(projectId);
  const [tab, setTab] = useState<"all" | "comments">("all");

  const stateMap = new Map((states ?? []).map((state) => [state.id, state]));
  const sprintMap = new Map((sprints ?? []).map((sprint) => [sprint.id, sprint]));
  const labelMap = new Map((labels ?? []).map((label) => [label.id, label]));
  const ctx: FeedContext = { memberMap, stateMap, sprintMap, labelMap };

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

  if (!showTabs) {
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
