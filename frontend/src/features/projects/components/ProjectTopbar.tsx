import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ProjectKeyBadge } from "./ProjectKeyBadge";
import type { ProjectRow } from "../types";

export function ProjectTopbar({ project, view }: { project: ProjectRow; view: "board" | "list" }) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between border-b border-border px-6 py-4">
      <div className="flex items-center gap-2">
        <ProjectKeyBadge projectKey={project.key} />
        <h1 className="text-lg font-semibold">{project.name}</h1>
      </div>
      <div className="flex items-center gap-3">
        <div className="inline-flex gap-0.5 rounded-md border border-border p-0.5">
          <Button
            variant={view === "board" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => navigate(`/projects/${project.id}/board`)}
          >
            Board
          </Button>
          <Button
            variant={view === "list" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => navigate(`/projects/${project.id}/list`)}
          >
            List
          </Button>
        </div>
        {/* Creation modal (form, validation, assignee picker) is separate scope — disabled/inert for this pass. */}
        <Button variant="default" size="sm" disabled title="Ticket creation is coming soon">
          New ticket
        </Button>
      </div>
    </div>
  );
}
