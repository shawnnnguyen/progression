import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ProjectKeyBadge } from "@/features/projects/components/ProjectKeyBadge";
import type { ProjectRow } from "@/features/projects/types";

export function ProjectNavItem({ project }: { project: ProjectRow }) {
  const location = useLocation();
  const isActive = location.pathname.startsWith(`/projects/${project.id}`);

  return (
    <Link
      to={`/projects/${project.id}/board`}
      className={cn(
        "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
      )}
    >
      <ProjectKeyBadge projectKey={project.key} className="h-4 px-1 text-[10px]" />
      <span className="truncate">{project.name}</span>
    </Link>
  );
}
