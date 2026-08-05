import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { listProjectMembers } from "../api/projectsApi";
import type { EffectiveProjectMember } from "../types";

export function useProjectMembers(projectId: string | undefined) {
  return useQuery({
    queryKey: ["projects", projectId, "members"],
    queryFn: () => listProjectMembers(projectId!).then((res) => res.data),
    enabled: !!projectId,
  });
}

export function useProjectMemberMap(projectId: string | undefined) {
  const query = useProjectMembers(projectId);
  const memberMap = useMemo(() => {
    const map = new Map<string, EffectiveProjectMember>();
    for (const member of query.data ?? []) {
      map.set(member.userId, member);
    }
    return map;
  }, [query.data]);
  return { ...query, memberMap };
}
