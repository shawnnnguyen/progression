import { useQuery } from "@tanstack/react-query";
import { listLabels } from "../api/labelsApi";

export function useLabels(projectId: string | undefined) {
  return useQuery({
    queryKey: ["projects", projectId, "labels"],
    queryFn: () => listLabels(projectId!).then((res) => res.data),
    enabled: !!projectId,
  });
}
