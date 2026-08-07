import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentOrg } from "@/features/orgs/hooks/useCurrentOrg";
import { useOrgProjects } from "@/features/projects/hooks/useOrgProjects";
import { useProjectsByIds } from "@/features/projects/hooks/useProjectsByIds";
import { useMyTickets } from "@/features/tickets/hooks/useMyTickets";
import { useWorkflowStatesByProjectIds } from "@/features/workflow/hooks/useWorkflowStatesByProjectIds";
import { useSprintsByProjectIds } from "@/features/sprints/hooks/useSprintsByProjectIds";
import type { WorkflowState } from "@/features/workflow/types";
import type { Sprint } from "@/features/sprints/types";
import { MyIssuesPanel } from "./MyIssuesPanel";
import { DashboardRightRail } from "./DashboardRightRail";

export function DashboardPage() {
  const { currentOrgId } = useCurrentOrg();
  const orgProjectsQuery = useOrgProjects(currentOrgId);
  const myTicketsQuery = useMyTickets();

  const tickets = myTicketsQuery.data?.tickets ?? [];
  const projectIds = useMemo(
    () => Array.from(new Set((myTicketsQuery.data?.tickets ?? []).map((ticket) => ticket.projectId))),
    [myTicketsQuery.data],
  );

  const projectQueries = useProjectsByIds(projectIds);
  const workflowStateQueries = useWorkflowStatesByProjectIds(projectIds);
  const sprintQueries = useSprintsByProjectIds(projectIds);

  const isLoading =
    myTicketsQuery.isLoading ||
    orgProjectsQuery.isLoading ||
    projectQueries.some((query) => query.isLoading) ||
    workflowStateQueries.some((query) => query.isLoading) ||
    sprintQueries.some((query) => query.isLoading);

  if (isLoading) {
    return (
      <div className="grid grid-cols-[1fr_320px] gap-6 p-6">
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (myTicketsQuery.isError || orgProjectsQuery.isError) {
    return (
      <div className="p-10 text-center text-muted-foreground">
        Something went wrong loading your dashboard.
      </div>
    );
  }

  const stateById = new Map<string, WorkflowState>();
  for (const query of workflowStateQueries) {
    for (const state of query.data ?? []) stateById.set(state.id, state);
  }

  const projectKeyById = new Map<string, string>();
  for (const query of projectQueries) {
    if (query.data) projectKeyById.set(query.data.id, query.data.key);
  }

  const sprintById = new Map<string, Sprint>();
  for (const query of sprintQueries) {
    for (const sprint of query.data ?? []) sprintById.set(sprint.id, sprint);
  }

  return (
    <div className="grid grid-cols-[1fr_320px] gap-6 p-6">
      <MyIssuesPanel
        tickets={tickets}
        stateById={stateById}
        projectKeyById={projectKeyById}
        sprintById={sprintById}
        isCapped={myTicketsQuery.data?.isCapped ?? false}
      />
      <DashboardRightRail projects={orgProjectsQuery.data ?? []} />
    </div>
  );
}
