import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createInvite } from "../api/orgsApi";
import type { OrgRole } from "../types";

export function useSendInvites(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    // Independent per row — sent in parallel rather than awaited one at a
    // time, and partial failures don't block the rows that succeeded.
    mutationFn: async (rows: { email: string; role: OrgRole }[]) => {
      const results = await Promise.allSettled(rows.map((row) => createInvite(orgId, row)));
      const failed = results.filter((result): result is PromiseRejectedResult => result.status === "rejected");
      return { sent: results.length - failed.length, failed };
    },
    onSuccess: ({ sent, failed }) => {
      queryClient.invalidateQueries({ queryKey: ["orgs", orgId, "invites"] });
      if (failed.length > 0) {
        toast.error(sent > 0 ? `Sent ${sent}, but ${failed.length} invite(s) failed.` : "Failed to send invites.");
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to send invites");
    },
  });
}
