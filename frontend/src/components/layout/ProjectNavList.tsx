import { useCurrentOrg } from "@/features/orgs/hooks/useCurrentOrg";
import { useOrgProjects } from "@/features/projects/hooks/useOrgProjects";
import { ProjectNavItem } from "./ProjectNavItem";

export function ProjectNavList() {
  const { currentOrgId } = useCurrentOrg();
  const { data: projects, isLoading } = useOrgProjects(currentOrgId);

  if (isLoading) {
    return <div className="px-2 py-1.5 text-xs text-muted-foreground">Loading projects…</div>;
  }

  if (!projects || projects.length === 0) {
    return <div className="px-2 py-1.5 text-xs text-muted-foreground">No projects</div>;
  }

  return (
    <div className="flex flex-col gap-0.5">
      {projects.map((project) => (
        <ProjectNavItem key={project.id} project={project} />
      ))}
    </div>
  );
}
