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
  { name: "Todo", category: "TODO", position: 0, isDefault: true },
  { name: "In Progress", category: "INPROGRESS", position: 1, isDefault: false },
  { name: "Done", category: "DONE", position: 2, isDefault: false },
  { name: "Canceled", category: "CANCELED", position: 3, isDefault: false },
];

export const SEED_WORKFLOW_TRANSITIONS: SeedWorkflowTransition[] = [
  { from: "Todo", to: "In Progress" },
  { from: "In Progress", to: "Done" },
  { from: "In Progress", to: "Todo" },
  { from: "In Progress", to: "Canceled" },
  { from: "Todo", to: "Canceled" },
  { from: "Done", to: "In Progress" },
  { from: "Canceled", to: "Todo" },
];
