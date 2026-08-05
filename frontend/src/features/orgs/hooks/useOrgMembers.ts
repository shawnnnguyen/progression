import { useQuery } from "@tanstack/react-query";
import { listOrgMembers } from "../api/orgsApi";

export function useOrgMembers(orgId: string | undefined) {
  return useQuery({
    queryKey: ["orgs", orgId, "members"],
    queryFn: () => listOrgMembers(orgId!).then((res) => res.data),
    enabled: !!orgId,
  });
}
