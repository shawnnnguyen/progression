import { ConflictError, ForbiddenError, NotFoundError } from "../errors/index.js";
import { can, type Actor, type AuthzDeps } from "./authz.js";
import type { LabelRow } from "./types.js";

export interface LabelRepository {
  findLabelById(labelId: string): Promise<LabelRow | null>;
  listLabelsForProject(projectId: string): Promise<LabelRow[]>;
  createLabel(projectId: string, name: string, color: string): Promise<LabelRow>;
  updateLabel(labelId: string, patch: { name?: string; color?: string }): Promise<LabelRow>;
  /** Throws if the label is still applied to any ticket (Restrict semantics, §3). */
  deleteLabel(labelId: string): Promise<void>;
  existsWithName(projectId: string, name: string): Promise<boolean>;
  isLabelInUse(labelId: string): Promise<boolean>;
}

export interface LabelServiceDeps extends AuthzDeps {
  labels: LabelRepository;
}

async function requireProjectRole(deps: LabelServiceDeps, actor: Actor, projectId: string, action: "label:read" | "label:create" | "label:update" | "label:delete") {
  const result = await can(deps, actor, action, { kind: "project", projectId });
  if (result === "NOT_FOUND") throw new NotFoundError("Project not found");
  if (result === "FORBIDDEN") throw new ForbiddenError();
}

export async function createLabel(
  actor: Actor,
  projectId: string,
  input: { name: string; color: string },
  deps: LabelServiceDeps,
): Promise<LabelRow> {
  await requireProjectRole(deps, actor, projectId, "label:create");
  if (await deps.labels.existsWithName(projectId, input.name)) {
    throw new ConflictError("A label with this name already exists in this project");
  }
  return deps.labels.createLabel(projectId, input.name, input.color);
}

export async function listLabels(actor: Actor, projectId: string, deps: LabelServiceDeps): Promise<LabelRow[]> {
  await requireProjectRole(deps, actor, projectId, "label:read");
  return deps.labels.listLabelsForProject(projectId);
}

export async function updateLabel(
  actor: Actor,
  labelId: string,
  patch: { name?: string; color?: string },
  deps: LabelServiceDeps,
): Promise<LabelRow> {
  const existing = await deps.labels.findLabelById(labelId);
  if (!existing) throw new NotFoundError("Label not found");
  await requireProjectRole(deps, actor, existing.projectId, "label:update");
  if (patch.name && (await deps.labels.existsWithName(existing.projectId, patch.name))) {
    throw new ConflictError("A label with this name already exists in this project");
  }
  return deps.labels.updateLabel(labelId, patch);
}

export async function deleteLabel(actor: Actor, labelId: string, deps: LabelServiceDeps): Promise<void> {
  const existing = await deps.labels.findLabelById(labelId);
  if (!existing) throw new NotFoundError("Label not found");
  await requireProjectRole(deps, actor, existing.projectId, "label:delete");
  if (await deps.labels.isLabelInUse(labelId)) {
    throw new ConflictError("Label is still applied to at least one ticket");
  }
  await deps.labels.deleteLabel(labelId);
}
