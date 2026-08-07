import { useState } from "react";
import { Link } from "react-router-dom";
import { LinkIcon, CheckIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProjectRow } from "@/features/projects/types";
import type { TicketRow } from "../types";

export function TicketDetailTopbar({ project, ticket }: { project: ProjectRow; ticket: TicketRow }) {
  const [copied, setCopied] = useState(false);

  async function handleCopyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex h-14 shrink-0 items-center gap-2 border-b border-[var(--color-divider)] px-5">
      <Link
        to={`/projects/${project.id}/board`}
        className="text-sm text-[var(--color-neutral-500)] hover:text-[var(--color-text)] hover:underline"
      >
        {project.name}
      </Link>
      <ChevronRightIcon className="size-3.5 shrink-0 text-[var(--color-neutral-500)]" />
      <span className="text-sm font-medium text-[var(--color-text)]">
        {project.key}-{ticket.number}
      </span>

      <div className="ml-auto flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={handleCopyLink}>
          {copied ? <CheckIcon /> : <LinkIcon />}
          {copied ? "Copied" : "Copy link"}
        </Button>
        <Button variant="outline" size="sm" disabled title="Ticket subscriptions are coming soon">
          Subscribe
        </Button>
      </div>
    </div>
  );
}
