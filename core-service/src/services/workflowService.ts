import { ForbiddenError, NotFoundError } from "../errors/index.js";
import { can, type Actor, type AuthzDeps } from "./authz.js";
import type { WorkflowStateRow, WorkflowTransitionRow } from "./types.js";

export interface WorkflowReadRepository {
  listWorkflowStates(projectId: string): Promise<WorkflowStateRow[]>;
  listWorkflowTransitions(projectId: string): Promise<WorkflowTransitionRow[]>;
}

export interface WorkflowServiceDeps extends AuthzDeps {
  workflow: WorkflowReadRepository;
}

async function requireProjectRead(deps: WorkflowServiceDeps, actor: Actor, projectId: string) {
  const result = await can(deps, actor, "workflow:read", { kind: "project", projectId });
  if (result === "NOT_FOUND") throw new NotFoundError("Project not found");
  if (result === "FORBIDDEN") throw new ForbiddenError();
}

export async function listWorkflowStates(actor: Actor, projectId: string, deps: WorkflowServiceDeps) {
  await requireProjectRead(deps, actor, projectId);
  return deps.workflow.listWorkflowStates(projectId);
}

export async function listWorkflowTransitions(actor: Actor, projectId: string, deps: WorkflowServiceDeps) {
  await requireProjectRead(deps, actor, projectId);
  return deps.workflow.listWorkflowTransitions(projectId);
}
