import { useMemo } from "react";
import { useWorkflowTransitions } from "./useWorkflowTransitions";
import { useWorkflowStateMap } from "./useWorkflowStateMap";
import type { WorkflowState } from "../types";

export interface AvailableTransition {
  transitionId: string;
  toState: WorkflowState;
}

/** Legal moves for the ticket's current state — drives the board's drag-and-drop drop-target styling (see useBoardDragAndDrop). */
export function useAvailableTransitions(projectId: string | undefined, fromStateId: string | undefined) {
  const transitionsQuery = useWorkflowTransitions(projectId);
  const { stateMap, isLoading: statesLoading, isError: statesError } = useWorkflowStateMap(projectId);

  const availableTransitions = useMemo<AvailableTransition[]>(() => {
    if (!fromStateId) return [];
    const result: AvailableTransition[] = [];
    for (const transition of transitionsQuery.data ?? []) {
      if (transition.fromStateId !== fromStateId) continue;
      const toState = stateMap.get(transition.toStateId);
      if (toState) result.push({ transitionId: transition.id, toState });
    }
    return result;
  }, [transitionsQuery.data, stateMap, fromStateId]);

  return {
    availableTransitions,
    isLoading: transitionsQuery.isLoading || statesLoading,
    isError: transitionsQuery.isError || statesError,
  };
}
