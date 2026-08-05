import { useQuery } from "@tanstack/react-query";
import { listOrgs } from "../api/orgsApi";

export function useOrgs() {
  return useQuery({
    queryKey: ["orgs"],
    queryFn: () => listOrgs().then((res) => res.data),
  });
}
