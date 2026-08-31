import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { PageTopbar } from "@/components/layout/PageTopbar";
import { NewTicketModal } from "@/features/tickets/components/create/NewTicketModal";
import { ProjectKeyBadge } from "./ProjectKeyBadge";
import type { ProjectRow } from "../types";

const VIEW_OPTIONS = [
  { key: "board", label: "Board" },
  { key: "list", label: "List" },
  { key: "sprints", label: "Sprints" },
] as const;

export function ProjectTopbar({ project, view }: { project: ProjectRow; view: "board" | "list" | "sprints" }) {
  const navigate = useNavigate();

  return (
    <PageTopbar
      left={
        <>
          <ProjectKeyBadge projectKey={project.key} />
          <h1 className="font-heading text-sm font-semibold">{project.name}</h1>
          <div className="ml-1 inline-flex divide-x divide-border overflow-hidden rounded-md border border-border">
            {VIEW_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => navigate(`/projects/${project.id}/${option.key}`)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium leading-none",
                  option.key === view
                    ? "text-primary ring-1 ring-inset ring-primary"
                    : "hover:bg-muted/50"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      }
      right={<NewTicketModal project={project} />}
    />
  );
}
