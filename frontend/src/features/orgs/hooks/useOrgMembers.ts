import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { listOrgMembers } from "../api/orgsApi";
import type { OrgMember } from "../types";

export function useOrgMembers(orgId: string | undefined) {
  return useQuery({
    queryKey: ["orgs", orgId, "members"],
    queryFn: () => listOrgMembers(orgId!).then((res) => res.data),
    enabled: !!orgId,
  });
}

export function useOrgMemberMap(orgId: string | undefined) {
  const query = useOrgMembers(orgId);
  const memberMap = useMemo(() => {
    const map = new Map<string, OrgMember>();
    for (const member of query.data ?? []) {
      map.set(member.userId, member);
    }
    return map;
  }, [query.data]);
  return { ...query, memberMap };
}
