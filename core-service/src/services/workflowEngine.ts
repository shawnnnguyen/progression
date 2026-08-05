export interface WorkflowTransitionRow {
  fromStateId: string;
  toStateId: string;
}

export function isTransitionAllowed(
  fromStateId: string,
  toStateId: string,
  transitions: WorkflowTransitionRow[],
): boolean {
  return transitions.some((t) => t.fromStateId === fromStateId && t.toStateId === toStateId);
}

export type StateCategory = "BACKLOG" | "TODO" | "INPROGRESS" | "DONE" | "CANCELED";

export interface SeedWorkflowState {
  name: string;
  category: StateCategory;
  position: number;
  isDefault: boolean;
}

export interface SeedWorkflowTransition {
  from: string;
  to: string;
}

export const SEED_WORKFLOW_STATES: SeedWorkflowState[] = [
  { name: "Backlog", category: "BACKLOG", position: 0, isDefault: false },
  { name: "Todo", category: "TODO", position: 1, isDefault: true },
  { name: "In Progress", category: "INPROGRESS", position: 2, isDefault: false },
  { name: "Done", category: "DONE", position: 3, isDefault: false },
  { name: "Canceled", category: "CANCELED", position: 4, isDefault: false },
];

// Every state can move to every other state — a curated sequential graph was
// too restrictive in practice, so the default workflow permits any-to-any
// transitions instead. Generated (not hand-listed) so it stays complete
// automatically if SEED_WORKFLOW_STATES ever changes.
export const SEED_WORKFLOW_TRANSITIONS: SeedWorkflowTransition[] = SEED_WORKFLOW_STATES.flatMap((from) =>
  SEED_WORKFLOW_STATES.filter((to) => to.name !== from.name).map((to) => ({ from: from.name, to: to.name })),
);
