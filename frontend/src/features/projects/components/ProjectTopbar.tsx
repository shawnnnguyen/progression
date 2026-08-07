import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ProjectKeyBadge } from "./ProjectKeyBadge";
import type { ProjectRow } from "../types";

const VIEW_OPTIONS = [
  { key: "board", label: "Board" },
  { key: "list", label: "List" },
] as const;

export function ProjectTopbar({ project, view }: { project: ProjectRow; view: "board" | "list" }) {
  const navigate = useNavigate();

  return (
    <div className="flex h-16 shrink-0 items-center gap-3 border-b border-border px-6">
      <ProjectKeyBadge projectKey={project.key} className="text-xs px-2 py-1" />
      <h1 className="font-heading text-lg font-semibold">{project.name}</h1>
      <div className="ml-3 inline-flex divide-x divide-border overflow-hidden rounded-md border border-border">
        {VIEW_OPTIONS.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => navigate(`/projects/${project.id}/${option.key}`)}
            className={cn(
              "px-4 py-2 text-sm font-medium leading-none",
              option.key === view
                ? "text-primary ring-1 ring-inset ring-primary"
                : "hover:bg-muted/50"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
      <Button
        variant="default"
        size="lg"
        disabled
        title="Ticket creation is coming soon"
        className="ml-auto"
      >
        New ticket
      </Button>
    </div>
  );
}
