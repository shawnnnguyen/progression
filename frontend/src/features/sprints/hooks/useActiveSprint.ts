import { useMemo } from "react";
import { useSprints } from "./useSprints";

/** No server-side "active sprint" filter (backend gap) — filtered client-side. */
export function useActiveSprint(projectId: string | undefined) {
  const query = useSprints(projectId);
  const activeSprint = useMemo(() => query.data?.find((sprint) => sprint.status === "ACTIVE") ?? null, [query.data]);
  return { ...query, activeSprint };
}
