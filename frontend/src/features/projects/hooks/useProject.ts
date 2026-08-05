import { useQuery } from "@tanstack/react-query";
import { getProject } from "../api/projectsApi";

export function useProject(projectId: string | undefined) {
  return useQuery({
    queryKey: ["projects", projectId],
    queryFn: () => getProject(projectId!).then((res) => res.data),
    enabled: !!projectId,
  });
}
