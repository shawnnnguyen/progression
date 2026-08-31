import { apiFetch } from "@/lib/api";
import type { CreateSprintInput, Sprint, SprintStatus } from "../types";

export function listSprints(projectId: string) {
  return apiFetch<{ data: Sprint[] }>(`/projects/${projectId}/sprints`);
}

export function createSprint(projectId: string, input: CreateSprintInput) {
  return apiFetch<{ data: Sprint }>(`/projects/${projectId}/sprints`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateSprint(sprintId: string, patch: { status: SprintStatus }) {
  return apiFetch<{ data: Sprint }>(`/sprints/${sprintId}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}
