import { useQueries } from "@tanstack/react-query";
import { listSprints } from "../api/sprintsApi";

/** Fans out one cached sprints query per project id. */
export function useSprintsByProjectIds(projectIds: string[]) {
  return useQueries({
    queries: projectIds.map((projectId) => ({
      queryKey: ["projects", projectId, "sprints"],
      queryFn: () => listSprints(projectId).then((res) => res.data),
    })),
  });
}
