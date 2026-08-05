import { useQuery } from "@tanstack/react-query";
import { listSprints } from "../api/sprintsApi";

export function useSprints(projectId: string | undefined) {
  return useQuery({
    queryKey: ["projects", projectId, "sprints"],
    queryFn: () => listSprints(projectId!).then((res) => res.data),
    enabled: !!projectId,
  });
}
