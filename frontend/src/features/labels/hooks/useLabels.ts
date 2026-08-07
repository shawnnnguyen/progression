import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createLabel, deleteLabel, listLabels } from "../api/labelsApi";

export function labelsQueryKey(projectId: string | undefined) {
  return ["projects", projectId, "labels"];
}

export function useLabels(projectId: string | undefined) {
  return useQuery({
    queryKey: labelsQueryKey(projectId),
    queryFn: () => listLabels(projectId!).then((res) => res.data),
    enabled: !!projectId,
  });
}

export function useCreateLabel(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["projects", projectId, "labels", "create"],
    mutationFn: (input: { name: string; color: string }) =>
      createLabel(projectId, input).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: labelsQueryKey(projectId) });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to create label");
    },
  });
}

export function useDeleteLabel(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["projects", projectId, "labels", "delete"],
    mutationFn: (labelId: string) => deleteLabel(labelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: labelsQueryKey(projectId) });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to delete label");
    },
  });
}
