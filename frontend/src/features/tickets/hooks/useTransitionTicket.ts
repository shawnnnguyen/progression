import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { transitionTicket } from "../api/ticketsApi";
import { normalizeTicketFilters } from "../lib/normalizeTicketFilters";
import { mapInfinitePages } from "../lib/mapInfinitePages";
import type { TicketFilters, TicketsResult } from "../types";

interface TransitionInput {
  ticketId: string;
  toStateId: string;
  version: number;
}

export function useTransitionTicket(projectId: string, filters: TicketFilters) {
  const queryClient = useQueryClient();
  const normalizedFilters = normalizeTicketFilters(filters);
  const queryKey = ["projects", projectId, "tickets", normalizedFilters];

  return useMutation({
    mutationFn: (input: TransitionInput) =>
      transitionTicket(input.ticketId, { toStateId: input.toStateId, version: input.version }),

    onMutate: async (input: TransitionInput) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<TicketsResult>(queryKey);
      queryClient.setQueryData<TicketsResult>(queryKey, (data) =>
        mapInfinitePages(data, input.ticketId, { stateId: input.toStateId, version: input.version + 1 }),
      );
      return { previous };
    },

    onError: (error, _input, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
      toast.error(error instanceof Error ? error.message : "Failed to move ticket");
    },

    // Background reconciliation only — the optimistic patch already updated the
    // visible UI, so this must not show the first-load Skeleton treatment.
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", projectId, "tickets"], refetchType: "active" });
      queryClient.invalidateQueries({ queryKey: ["me", "tickets"], refetchType: "active" });
    },
  });
}
