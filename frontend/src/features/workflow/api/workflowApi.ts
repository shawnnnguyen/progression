import { apiFetch } from "@/lib/api";
import type { WorkflowState, WorkflowTransition } from "../types";

export function listWorkflowStates(projectId: string) {
  return apiFetch<{ data: WorkflowState[] }>(`/projects/${projectId}/workflow-states`);
}

export function listWorkflowTransitions(projectId: string) {
  return apiFetch<{ data: WorkflowTransition[] }>(`/projects/${projectId}/workflow-transitions`);
}
