import { apiFetch } from "@/lib/api";
import type { Sprint } from "../types";

export function listSprints(projectId: string) {
  return apiFetch<{ data: Sprint[] }>(`/projects/${projectId}/sprints`);
}
