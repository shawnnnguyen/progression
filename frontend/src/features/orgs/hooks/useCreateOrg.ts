import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createOrg } from "../api/orgsApi";

export function useCreateOrg() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { name: string; slug?: string }) => createOrg(input).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orgs"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to create organization");
    },
  });
}
