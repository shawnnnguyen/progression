import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { setAccessToken } from "@/lib/authToken";
import { login, register } from "../api/authApi";

export function useSignUp() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();

  return useMutation({
    mutationFn: async (input: { email: string; name: string; password: string }) => {
      await register(input);
      return login({ email: input.email, password: input.password });
    },
    onSuccess: ({ data }) => {
      setAccessToken(data.accessToken);
      queryClient.invalidateQueries({ queryKey: ["me"] });
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from ?? "/dashboard", { replace: true });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to create account");
    },
  });
}
