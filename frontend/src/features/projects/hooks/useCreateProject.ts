import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createProject } from "../api/projectsApi";
import type { ProjectVisibility } from "../types";

export function useCreateProject(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { key: string; name: string; visibility?: ProjectVisibility }) =>
      createProject(orgId, input).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orgs", orgId, "projects"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to create project");
    },
  });
}
