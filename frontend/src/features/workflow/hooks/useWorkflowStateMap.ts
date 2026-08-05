import { useMemo } from "react";
import { useWorkflowStates } from "./useWorkflowStates";
import type { WorkflowState } from "../types";

export function useWorkflowStateMap(projectId: string | undefined) {
  const query = useWorkflowStates(projectId);
  const stateMap = useMemo(() => {
    const map = new Map<string, WorkflowState>();
    for (const state of query.data ?? []) map.set(state.id, state);
    return map;
  }, [query.data]);
  return { ...query, stateMap };
}
