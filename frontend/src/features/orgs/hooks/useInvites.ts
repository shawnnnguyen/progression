import { useQuery } from "@tanstack/react-query";
import { listInvites } from "../api/orgsApi";

export function useInvites(orgId: string | undefined) {
  return useQuery({
    queryKey: ["orgs", orgId, "invites"],
    queryFn: () => listInvites(orgId!).then((res) => res.data),
    enabled: !!orgId,
  });
}
