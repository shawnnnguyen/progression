import { useQueries } from "@tanstack/react-query";
import { listWorkflowStates } from "../api/workflowApi";

/** Dashboard-only: fans out one cached workflow-states query per project id. */
export function useWorkflowStatesByProjectIds(projectIds: string[]) {
  return useQueries({
    queries: projectIds.map((projectId) => ({
      queryKey: ["projects", projectId, "workflow-states"],
      queryFn: () =>
        listWorkflowStates(projectId).then((res) => [...res.data].sort((a, b) => a.position - b.position)),
    })),
  });
}
