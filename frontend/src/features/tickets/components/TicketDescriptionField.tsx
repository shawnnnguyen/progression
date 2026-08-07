import { Pencil } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useUpdateTicket } from "../hooks/useUpdateTicket";
import type { TicketRow } from "../types";
import { TicketMarkdown } from "./TicketMarkdown";

export function TicketDescriptionField({ ticket, projectId }: { ticket: TicketRow; projectId: string }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(ticket.description ?? "");
  const baseVersionRef = useRef(ticket.version);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const updateTicket = useUpdateTicket(projectId, ticket.id, ticket.number);

  useEffect(() => {
    if (editing) textareaRef.current?.focus();
  }, [editing]);

  function startEditing() {
    setDraft(ticket.description ?? "");
    baseVersionRef.current = ticket.version;
    setEditing(true);
  }

  function cancel() {
    setEditing(false);
    setDraft(ticket.description ?? "");
  }

  function save() {
    const trimmed = draft.trim();
    if (trimmed === (ticket.description ?? "")) {
      setEditing(false);
      return;
    }
    updateTicket.mutate(
      { version: baseVersionRef.current, description: trimmed || null },
      { onSuccess: () => setEditing(false) },
    );
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-2">
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") cancel();
            if ((event.metaKey || event.ctrlKey) && event.key === "Enter") save();
          }}
          placeholder="Add a description..."
          rows={6}
          className="w-full resize-y rounded-md border border-[var(--color-divider)] bg-[var(--color-bg)] p-2 text-[18px] text-[var(--color-text)] outline-none placeholder:text-[var(--color-neutral-500)] focus:border-[var(--color-accent)]"
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={cancel} disabled={updateTicket.isPending}>
              Cancel
            </Button>
            <Button size="sm" onClick={save} disabled={updateTicket.isPending}>
              Save
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (ticket.description) {
    return (
      <div className="group relative -m-2 rounded-md p-2 hover:bg-[var(--color-surface)]">
        <TicketMarkdown content={ticket.description} className="text-[18px]" />
        <button
          type="button"
          onClick={startEditing}
          aria-label="Edit description"
          className="absolute top-1 right-1 rounded-md p-1.5 text-[var(--color-neutral-500)] opacity-0 outline-none hover:bg-[var(--color-bg)] hover:text-[var(--color-text)] group-hover:opacity-100 focus-visible:opacity-100"
        >
          <Pencil className="size-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={startEditing}
      className="-m-2 rounded-md p-2 text-left text-[18px] text-[var(--color-neutral-500)] outline-none hover:bg-[var(--color-surface)] focus-visible:bg-[var(--color-surface)]"
    >
      Add a description...
    </button>
  );
}
