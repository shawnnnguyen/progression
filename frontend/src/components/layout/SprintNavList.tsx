import { useCurrentOrg } from "@/features/orgs/hooks/useCurrentOrg";
import { useOrgProjects } from "@/features/projects/hooks/useOrgProjects";
import { useSprintsByProjectIds } from "@/features/sprints/hooks/useSprintsByProjectIds";
import type { ProjectRow } from "@/features/projects/types";
import type { Sprint } from "@/features/sprints/types";
import { SprintNavItem } from "./SprintNavItem";

export function SprintNavList() {
  const { currentOrgId } = useCurrentOrg();
  const { data: projects, isLoading: projectsLoading } = useOrgProjects(currentOrgId);
  const projectIds = projects?.map((project) => project.id) ?? [];
  const sprintQueries = useSprintsByProjectIds(projectIds);

  if (projectsLoading || sprintQueries.some((query) => query.isLoading)) {
    return <div className="px-2 py-1.5 text-xs text-muted-foreground">Loading sprints…</div>;
  }

  const activeSprints = (projects ?? [])
    .map((project, index) => {
      const sprint = sprintQueries[index]?.data?.find((s) => s.status === "ACTIVE");
      return sprint ? { project, sprint } : null;
    })
    .filter((entry): entry is { project: ProjectRow; sprint: Sprint } => entry !== null);

  if (activeSprints.length === 0) {
    return <div className="px-2 py-1.5 text-xs text-muted-foreground">No active sprints</div>;
  }

  return (
    <div className="flex flex-col gap-0.5">
      {activeSprints.map(({ project, sprint }) => (
        <SprintNavItem key={sprint.id} project={project} sprint={sprint} />
      ))}
    </div>
  );
}
