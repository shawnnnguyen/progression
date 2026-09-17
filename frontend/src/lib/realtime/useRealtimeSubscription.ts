import { useEffect } from "react";
import { subscribeToProject } from "./connection";

export function useRealtimeSubscription(projectId: string | undefined) {
  useEffect(() => {
    if (!projectId) return;
    return subscribeToProject(projectId);
  }, [projectId]);
}
