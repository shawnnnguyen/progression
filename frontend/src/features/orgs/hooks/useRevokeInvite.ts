import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { revokeInvite } from "../api/orgsApi";

export function useRevokeInvite(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (inviteId: string) => revokeInvite(orgId, inviteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orgs", orgId, "invites"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to revoke invite");
    },
  });
}
