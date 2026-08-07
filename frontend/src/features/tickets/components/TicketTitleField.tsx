import { Pencil } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useUpdateTicket } from "../hooks/useUpdateTicket";
import type { TicketRow } from "../types";

export function TicketTitleField({ ticket, projectId }: { ticket: TicketRow; projectId: string }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(ticket.title);
  const baseVersionRef = useRef(ticket.version);
  const inputRef = useRef<HTMLInputElement>(null);
  const updateTicket = useUpdateTicket(projectId, ticket.id, ticket.number);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  function startEditing() {
    setDraft(ticket.title);
    baseVersionRef.current = ticket.version;
    setEditing(true);
  }

  function cancel() {
    setEditing(false);
    setDraft(ticket.title);
  }

  function save() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    if (trimmed === ticket.title) {
      setEditing(false);
      return;
    }
    updateTicket.mutate({ version: baseVersionRef.current, title: trimmed }, { onSuccess: () => setEditing(false) });
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-2">
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") cancel();
            if (event.key === "Enter") save();
          }}
          maxLength={500}
          className="w-full rounded-md border border-[var(--color-divider)] bg-[var(--color-bg)] p-2 text-3xl font-semibold text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
        />
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={cancel} disabled={updateTicket.isPending}>
            Cancel
          </Button>
          <Button size="sm" onClick={save} disabled={updateTicket.isPending || !draft.trim()}>
            Save
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={startEditing}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          startEditing();
        }
      }}
      className="group relative -m-2 cursor-text rounded-md p-2 text-left outline-none hover:bg-[var(--color-surface)] focus-visible:bg-[var(--color-surface)]"
    >
      <h1 className="text-3xl font-semibold text-[var(--color-text)]">{ticket.title}</h1>
      <span
        aria-hidden
        className="absolute top-1 right-1 rounded-md p-1.5 text-[var(--color-neutral-500)] opacity-0 group-hover:opacity-100"
      >
        <Pencil className="size-3.5" />
      </span>
    </div>
  );
}
