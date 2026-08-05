import { apiFetch } from "@/lib/api";
import type { Label } from "../types";

export function listLabels(projectId: string) {
  return apiFetch<{ data: Label[] }>(`/projects/${projectId}/labels`);
}
