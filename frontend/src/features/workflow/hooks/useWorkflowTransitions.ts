import { useQuery } from "@tanstack/react-query";
import { listWorkflowTransitions } from "../api/workflowApi";

export function useWorkflowTransitions(projectId: string | undefined) {
  return useQuery({
    queryKey: ["projects", projectId, "workflow-transitions"],
    queryFn: () => listWorkflowTransitions(projectId!).then((res) => res.data),
    enabled: !!projectId,
  });
}
