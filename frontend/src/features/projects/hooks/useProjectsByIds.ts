import { useQueries } from "@tanstack/react-query";
import { getProject } from "../api/projectsApi";

/** Dashboard-only: fans out one cached ['projects', id] query per id in a dynamic set. */
export function useProjectsByIds(projectIds: string[]) {
  return useQueries({
    queries: projectIds.map((projectId) => ({
      queryKey: ["projects", projectId],
      queryFn: () => getProject(projectId).then((res) => res.data),
    })),
  });
}
