import { apiFetch } from "@/lib/api";
import type { Label } from "../types";

export function listLabels(projectId: string) {
  return apiFetch<{ data: Label[] }>(`/projects/${projectId}/labels`);
}

export function createLabel(projectId: string, input: { name: string; color: string }) {
  return apiFetch<{ data: Label }>(`/projects/${projectId}/labels`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function deleteLabel(labelId: string) {
  return apiFetch<void>(`/labels/${labelId}`, { method: "DELETE" });
}
