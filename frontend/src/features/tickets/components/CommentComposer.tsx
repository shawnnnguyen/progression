import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCreateComment } from "../hooks/useComments";

export function CommentComposer({ ticketId }: { ticketId: string }) {
  const [body, setBody] = useState("");
  const createComment = useCreateComment(ticketId);

  function handleSubmit() {
    const trimmed = body.trim();
    if (!trimmed) return;
    createComment.mutate(trimmed, { onSuccess: () => setBody("") });
  }

  return (
    <div className="flex flex-col gap-2 border-t border-[var(--color-divider)] pt-3">
      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder="Leave a comment..."
        rows={3}
        className="w-full resize-none rounded-md border border-[var(--color-divider)] bg-[var(--color-bg)] p-2 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-neutral-500)] focus:border-[var(--color-accent)]"
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled title="Attachments aren't supported yet">
            Attach
          </Button>
          <Button
            size="sm"
            disabled={!body.trim() || createComment.isPending}
            onClick={handleSubmit}
          >
            Comment
          </Button>
        </div>
      </div>
    </div>
  );
}
