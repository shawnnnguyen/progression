import { ForbiddenError, NotFoundError, ValidationError } from "../errors/index.js";
import { can, type Actor, type AuthzDeps } from "./authz.js";
import type { EventBus } from "./eventBus.js";
import type { Page, SprintRow, SprintStatus, TicketRow } from "./types.js";

export interface CreateSprintInput {
  name: string;
  goal?: string | null;
  startDate: Date;
  endDate: Date;
}

export interface UpdateSprintInput {
  name?: string;
  goal?: string | null;
  startDate?: Date;
  endDate?: Date;
  status?: SprintStatus;
}

export interface SprintRepository {
  findSprintById(sprintId: string): Promise<SprintRow | null>;
  listSprintsForProject(projectId: string): Promise<SprintRow[]>;
  createSprint(projectId: string, input: CreateSprintInput): Promise<SprintRow>;
  updateSprint(sprintId: string, patch: UpdateSprintInput): Promise<SprintRow>;
  deleteSprint(sprintId: string): Promise<void>;
  listSprintTickets(sprintId: string, cursor?: string | null, limit?: number): Promise<Page<TicketRow>>;
}

export interface SprintServiceDeps extends AuthzDeps {
  sprints: SprintRepository;
  eventBus: EventBus;
}

async function requireProjectRole(deps: SprintServiceDeps, actor: Actor, projectId: string, action: "sprint:read" | "sprint:create" | "sprint:update" | "sprint:delete") {
  const result = await can(deps, actor, action, { kind: "project", projectId });
  if (result === "NOT_FOUND") throw new NotFoundError("Project not found");
  if (result === "FORBIDDEN") throw new ForbiddenError();
}

function assertValidDateRange(startDate: Date, endDate: Date) {
  if (endDate <= startDate) {
    throw new ValidationError("endDate must be after startDate");
  }
}

export async function createSprint(
  actor: Actor,
  projectId: string,
  input: CreateSprintInput,
  deps: SprintServiceDeps,
): Promise<SprintRow> {
  await requireProjectRole(deps, actor, projectId, "sprint:create");
  assertValidDateRange(input.startDate, input.endDate);
  return deps.sprints.createSprint(projectId, input);
}

export async function listSprints(actor: Actor, projectId: string, deps: SprintServiceDeps): Promise<SprintRow[]> {
  await requireProjectRole(deps, actor, projectId, "sprint:read");
  return deps.sprints.listSprintsForProject(projectId);
}

export async function getSprint(
  actor: Actor,
  sprintId: string,
  deps: SprintServiceDeps,
  cursor?: string | null,
  limit?: number,
): Promise<{ sprint: SprintRow; tickets: Page<TicketRow> }> {
  const sprint = await deps.sprints.findSprintById(sprintId);
  if (!sprint) throw new NotFoundError("Sprint not found");
  await requireProjectRole(deps, actor, sprint.projectId, "sprint:read");
  const tickets = await deps.sprints.listSprintTickets(sprintId, cursor, limit);
  return { sprint, tickets };
}

export async function updateSprint(
  actor: Actor,
  sprintId: string,
  patch: UpdateSprintInput,
  deps: SprintServiceDeps,
): Promise<SprintRow> {
  const existing = await deps.sprints.findSprintById(sprintId);
  if (!existing) throw new NotFoundError("Sprint not found");
  await requireProjectRole(deps, actor, existing.projectId, "sprint:update");

  const startDate = patch.startDate ?? existing.startDate;
  const endDate = patch.endDate ?? existing.endDate;
  assertValidDateRange(startDate, endDate);

  const updated = await deps.sprints.updateSprint(sprintId, patch);

  deps.eventBus.publish({
    event: "sprint.updated",
    projectId: updated.projectId,
    data: { sprint: updated },
    actor: { userId: actor.userId, actorType: "user" },
  });

  return updated;
}

export async function deleteSprint(actor: Actor, sprintId: string, deps: SprintServiceDeps): Promise<void> {
  const existing = await deps.sprints.findSprintById(sprintId);
  if (!existing) throw new NotFoundError("Sprint not found");
  await requireProjectRole(deps, actor, existing.projectId, "sprint:delete");
  await deps.sprints.deleteSprint(sprintId);

  deps.eventBus.publish({
    event: "sprint.updated",
    projectId: existing.projectId,
    data: { sprintId, deleted: true },
    actor: { userId: actor.userId, actorType: "user" },
  });
}
