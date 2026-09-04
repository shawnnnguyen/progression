import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createOrg } from "../api/orgsApi";

export function useCreateOrg() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { name: string; slug?: string }) => createOrg(input).then((res) => res.data),
    onSuccess: () => {
      // Awaited (returned) so callers navigating on success — e.g. the onboarding
      // wizard, straight to /dashboard — don't race RequireOrgLayout reading a
      // stale, still-empty ["orgs"] cache and bouncing back to /onboarding.
      return queryClient.invalidateQueries({ queryKey: ["orgs"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to create organization");
    },
  });
}
