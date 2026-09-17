import { useState } from "react";
import { Link } from "react-router-dom";
import { IconLink, IconCheck, IconChevronRight } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { PageTopbar } from "@/components/layout/PageTopbar";
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
    <PageTopbar
      left={
        <>
          <Link
            to={`/projects/${project.id}/board`}
            className="text-sm text-[var(--color-neutral-500)] hover:text-[var(--color-text)] hover:underline"
          >
            {project.name}
          </Link>
          <IconChevronRight className="size-3 shrink-0 text-[var(--color-neutral-500)]" />
          <span className="text-sm font-medium text-[var(--color-text)]">
            {project.key}-{ticket.number}
          </span>
        </>
      }
      right={
        <>
          <Button variant="outline" size="sm" onClick={handleCopyLink}>
            {copied ? <IconCheck /> : <IconLink />}
            {copied ? "Copied" : "Copy link"}
          </Button>
          <Button variant="outline" size="sm" disabled title="Ticket subscriptions are coming soon">
            Subscribe
          </Button>
        </>
      }
    />
  );
}
