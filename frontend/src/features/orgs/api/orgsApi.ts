import { apiFetch } from "@/lib/api";
import type { Invite, Membership, Org, OrgMember, OrgRole } from "../types";

export function listOrgs() {
  return apiFetch<{ data: Org[] }>("/orgs");
}

export function createOrg(input: { name: string; slug?: string }) {
  return apiFetch<{ data: Org }>("/orgs", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function listOrgMembers(orgId: string) {
  return apiFetch<{ data: OrgMember[] }>(`/orgs/${orgId}/members`);
}

export function createInvite(orgId: string, input: { email: string; role: OrgRole }) {
  return apiFetch<{ data: { invite: Invite; token: string } }>(`/orgs/${orgId}/invites`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function listInvites(orgId: string) {
  return apiFetch<{ data: Invite[] }>(`/orgs/${orgId}/invites`);
}

export function revokeInvite(orgId: string, inviteId: string) {
  return apiFetch<void>(`/orgs/${orgId}/invites/${inviteId}`, { method: "DELETE" });
}

export function acceptInvite(inviteId: string, token: string) {
  return apiFetch<{ data: Membership }>(`/invites/${inviteId}/accept`, {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}
