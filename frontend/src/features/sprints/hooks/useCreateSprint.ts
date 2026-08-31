import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createSprint, updateSprint } from "../api/sprintsApi";
import type { CreateSprintInput } from "../types";

export function useCreateSprint(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["sprints", "create"],
    mutationFn: async (input: CreateSprintInput & { activateImmediately: boolean }) => {
      const { activateImmediately, ...body } = input;
      const sprint = await createSprint(projectId, body).then((res) => res.data);
      if (!activateImmediately) return sprint;

      try {
        return await updateSprint(sprint.id, { status: "ACTIVE" }).then((res) => res.data);
      } catch {
        // The sprint itself was created — surface that instead of a plain "failed to create".
        queryClient.invalidateQueries({ queryKey: ["projects", projectId, "sprints"], refetchType: "active" });
        throw new Error(`"${sprint.name}" was created as Planned, but activating it failed — activate it manually.`);
      }
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", projectId, "sprints"], refetchType: "active" });
    },

    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to create sprint");
    },
  });
}
