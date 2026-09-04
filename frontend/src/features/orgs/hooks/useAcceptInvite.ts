import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { acceptInvite } from "../api/orgsApi";

export function useAcceptInvite() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (input: { inviteId: string; token: string }) => acceptInvite(input.inviteId, input.token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orgs"] });
      navigate("/dashboard", { replace: true });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to accept invite");
    },
  });
}
