import { ActiveProjectCard } from "./ActiveProjectCard";
import { ActiveSprintCard } from "./ActiveSprintCard";
import { RecentActivityPanel } from "./RecentActivityPanel";
import type { ProjectRow } from "@/features/projects/types";

const TOP_N_PROJECTS = 3;

export function DashboardRightRail({ projects }: { projects: ProjectRow[] }) {
  const topProjects = projects.slice(0, TOP_N_PROJECTS);

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2">
        <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Active projects</h2>
        {topProjects.length === 0 ? (
          <p className="text-sm text-muted-foreground">No projects yet</p>
        ) : (
          topProjects.map((project) => <ActiveProjectCard key={project.id} project={project} />)
        )}
      </section>
      <ActiveSprintCard projects={projects} />
      <RecentActivityPanel />
    </div>
  );
}
