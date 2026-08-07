import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { updateTicket } from "../api/ticketsApi";
import { ticketQueryKey } from "./useTicket";
import type { TicketPatchInput, TicketRow } from "../types";

export function useUpdateTicket(projectId: string, ticketId: string, ticketNumber: number) {
  const queryClient = useQueryClient();
  const queryKey = ticketQueryKey(projectId, ticketNumber);

  return useMutation({
    mutationKey: ["tickets", ticketId, "update"],
    mutationFn: (patch: TicketPatchInput) => updateTicket(ticketId, patch).then((res) => res.data),

    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<TicketRow>(queryKey);
      if (previous) {
        const { labelIds: _labelIds, version: _version, ...fields } = patch;
        queryClient.setQueryData<TicketRow>(queryKey, { ...previous, ...fields, version: previous.version + 1 });
      }
      return { previous };
    },

    onError: (error, _patch, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
      queryClient.invalidateQueries({ queryKey });
      toast.error(error instanceof Error ? error.message : "Failed to update ticket — it may have changed elsewhere");
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ["projects", projectId, "tickets"], refetchType: "active" });
      queryClient.invalidateQueries({ queryKey: ["me", "tickets"], refetchType: "active" });
    },
  });
}
