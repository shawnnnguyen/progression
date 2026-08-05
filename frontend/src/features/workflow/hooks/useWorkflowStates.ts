import { useQuery } from "@tanstack/react-query";
import { listWorkflowStates } from "../api/workflowApi";

export function useWorkflowStates(projectId: string | undefined) {
  return useQuery({
    queryKey: ["projects", projectId, "workflow-states"],
    queryFn: () =>
      listWorkflowStates(projectId!).then((res) => [...res.data].sort((a, b) => a.position - b.position)),
    enabled: !!projectId,
  });
}
