import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createTicket } from "../api/ticketsApi";
import type { CreateTicketInput } from "../types";

export function useCreateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["tickets", "create"],
    mutationFn: (input: CreateTicketInput) => createTicket(input).then((res) => res.data),

    onSuccess: (ticket) => {
      queryClient.invalidateQueries({ queryKey: ["projects", ticket.projectId, "tickets"], refetchType: "active" });
      queryClient.invalidateQueries({ queryKey: ["me", "tickets"], refetchType: "active" });
    },

    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to create ticket");
    },
  });
}
