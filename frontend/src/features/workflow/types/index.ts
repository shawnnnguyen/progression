export type StateCategory = "BACKLOG" | "TODO" | "INPROGRESS" | "DONE" | "CANCELED";

export interface WorkflowState {
  id: string;
  projectId: string;
  name: string;
  category: StateCategory;
  position: number;
  isDefault: boolean;
}

export interface WorkflowTransition {
  id: string;
  projectId: string;
  fromStateId: string;
  toStateId: string;
}
