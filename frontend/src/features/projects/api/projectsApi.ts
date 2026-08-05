import { apiFetch } from "@/lib/api";
import type { EffectiveProjectMember, ProjectRow } from "../types";

export function listOrgProjects(orgId: string) {
  return apiFetch<{ data: ProjectRow[] }>(`/orgs/${orgId}/projects`);
}

export function getProject(projectId: string) {
  return apiFetch<{ data: ProjectRow }>(`/projects/${projectId}`);
}

export function listProjectMembers(projectId: string) {
  return apiFetch<{ data: EffectiveProjectMember[] }>(`/projects/${projectId}/members`);
}
