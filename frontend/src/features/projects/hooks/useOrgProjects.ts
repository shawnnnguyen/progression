import { useQuery } from "@tanstack/react-query";
import { listOrgProjects } from "../api/projectsApi";

export function useOrgProjects(orgId: string | undefined) {
  return useQuery({
    queryKey: ["orgs", orgId, "projects"],
    queryFn: () => listOrgProjects(orgId!).then((res) => res.data),
    enabled: !!orgId,
  });
}
