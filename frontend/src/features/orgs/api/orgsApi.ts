import { apiFetch } from "@/lib/api";
import type { Org, OrgMember } from "../types";

export function listOrgs() {
  return apiFetch<{ data: Org[] }>("/orgs");
}

export function listOrgMembers(orgId: string) {
  return apiFetch<{ data: OrgMember[] }>(`/orgs/${orgId}/members`);
}
