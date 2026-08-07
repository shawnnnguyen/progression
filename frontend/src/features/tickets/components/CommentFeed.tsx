import { Skeleton } from "@/components/ui/skeleton";
import { useProjectMemberMap } from "@/features/projects/hooks/useProjectMembers";
import { useComments } from "../hooks/useComments";
import { CommentCard } from "./ActivityFeed";

export function CommentFeed({ ticketId, projectId }: { ticketId: string; projectId: string }) {
  const { data: comments, isLoading } = useComments(ticketId);
  const { memberMap } = useProjectMemberMap(projectId);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (!comments || comments.length === 0) {
    return <p className="text-sm text-[var(--color-neutral-500)]">No comments yet.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {comments.map((comment) => (
        <CommentCard key={comment.id} comment={comment} memberMap={memberMap} />
      ))}
    </div>
  );
}
