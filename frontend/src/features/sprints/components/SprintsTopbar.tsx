import { Link } from "react-router-dom";
import { PageTopbar } from "@/components/layout/PageTopbar";
import { ProjectKeyBadge } from "@/features/projects/components/ProjectKeyBadge";
import type { ProjectRow } from "@/features/projects/types";
import { NewSprintModal } from "./NewSprintModal";

export function SprintsTopbar({ project }: { project: ProjectRow }) {
  return (
    <PageTopbar
      left={
        <>
          <Link
            to={`/projects/${project.id}/board`}
            className="flex items-center gap-2 text-sm text-[var(--color-neutral-500)] hover:text-[var(--color-text)]"
          >
            <ProjectKeyBadge projectKey={project.key} />
            {project.name}
          </Link>
          <span className="text-sm text-[var(--color-neutral-400)]">›</span>
          <h1 className="font-heading text-sm font-semibold">Sprints</h1>
        </>
      }
      right={<NewSprintModal project={project} />}
    />
  );
}
