import { ForbiddenError, IllegalTransitionError, NotFoundError, StaleStateError, ValidationError } from "../errors/index.js";
import { can, resolveProjectRole, type Actor, type AuthzDeps } from "./authz.js";
import type { EventBus } from "./eventBus.js";
import type { Page, Priority, TicketEventRow, TicketRow } from "./types.js";
import { isTransitionAllowed, type WorkflowTransitionRow } from "./workflowEngine.js";

export interface CreateTicketInput {
  projectId: string;
  title: string;
  description?: string | null;
  priority?: Priority;
  assigneeId?: string | null;
}

export interface TicketPatchInput {
  version: number;
  title?: string;
  description?: string | null;
  priority?: Priority;
  assigneeId?: string | null;
  sprintId?: string | null;
  labelIds?: string[];
}

export interface TransitionInput {
  toStateId: string;
  version: number;
}

export interface TicketFilter {
  stateId?: string;
  assigneeId?: string;
  labelId?: string;
  sprintId?: string;
  q?: string;
  /** Resync after a WS drop (§2): only tickets updated after this instant. */
  updatedSince?: Date;
  cursor?: string | null;
  limit?: number;
}

export interface TicketRepository {
  findTicketById(ticketId: string): Promise<TicketRow | null>;
  listTickets(projectId: string, filter: TicketFilter): Promise<Page<TicketRow>>;
  listTicketsAssignedToUser(userId: string, cursor?: string | null, limit?: number): Promise<Page<TicketRow>>;
  createTicket(
    input: CreateTicketInput & { reporterId: string },
    defaultStateId: string,
  ): Promise<TicketRow>;
  updateTicketIfVersionMatches(
    ticketId: string,
    expectedVersion: number,
    patch: Omit<TicketPatchInput, "version">,
    actorUserId: string,
  ): Promise<TicketRow | null>;
  transitionTicketState(
    ticketId: string,
    fromStateId: string,
    toStateId: string,
    expectedVersion: number,
    actorUserId: string,
  ): Promise<TicketRow | null>;
  listTicketEvents(ticketId: string, cursor?: string | null, limit?: number): Promise<Page<TicketEventRow>>;
}

export interface WorkflowRepository {
  listWorkflowStates(projectId: string): Promise<{ id: string; isDefault: boolean }[]>;
  listWorkflowTransitions(projectId: string): Promise<WorkflowTransitionRow[]>;
}

export interface TicketServiceDeps extends AuthzDeps {
  tickets: TicketRepository;
  workflow: WorkflowRepository;
  eventBus: EventBus;
}

async function requireProjectRole(deps: TicketServiceDeps, actor: Actor, projectId: string, action: Parameters<typeof can>[2]) {
  const result = await can(deps, actor, action, { kind: "project", projectId });
  if (result === "NOT_FOUND") throw new NotFoundError("Project not found");
  if (result === "FORBIDDEN") throw new ForbiddenError();
}

// An assignee must actually have (at least VIEWER) access to the project —
// otherwise "assign to teammate" doubles as a way to hand any user's ID a
// spot in a project's ticket list regardless of org/project membership.
async function assertAssignable(deps: TicketServiceDeps, assigneeId: string, projectId: string) {
  const role = await resolveProjectRole(deps, { userId: assigneeId, actorType: "user" }, projectId);
  if (!role) throw new ValidationError("assigneeId must be a member of this project");
}

export async function createTicket(actor: Actor, input: CreateTicketInput, deps: TicketServiceDeps): Promise<TicketRow> {
  await requireProjectRole(deps, actor, input.projectId, "ticket:create");
  if (input.assigneeId) await assertAssignable(deps, input.assigneeId, input.projectId);

  const states = await deps.workflow.listWorkflowStates(input.projectId);
  const defaultState = states.find((s) => s.isDefault);
  if (!defaultState) throw new NotFoundError("Project has no default workflow state");

  const ticket = await deps.tickets.createTicket({ ...input, reporterId: actor.userId }, defaultState.id);

  deps.eventBus.publish({
    event: "ticket.created",
    projectId: ticket.projectId,
    ticketId: ticket.id,
    data: { ticket },
    actor: { userId: actor.userId, actorType: "user" },
  });

  return ticket;
}

export async function getTicket(actor: Actor, ticketId: string, deps: TicketServiceDeps): Promise<TicketRow> {
  const ticket = await deps.tickets.findTicketById(ticketId);
  if (!ticket) throw new NotFoundError("Ticket not found");
  await requireProjectRole(deps, actor, ticket.projectId, "ticket:read");
  return ticket;
}

export async function listTickets(
  actor: Actor,
  projectId: string,
  filter: TicketFilter,
  deps: TicketServiceDeps,
): Promise<Page<TicketRow>> {
  await requireProjectRole(deps, actor, projectId, "ticket:read");
  return deps.tickets.listTickets(projectId, filter);
}

// "Tickets assigned to me across projects I belong to" (§1) — the
// repository only knows the assignee, not current project visibility, so
// this filters the page post-query against a live resolveProjectRole check
// per distinct project. That means a page can come back shorter than the
// requested limit even when more assigned tickets exist (they belong to a
// project the actor has since lost access to) — acceptable for a personal
// list view, and it's what makes "removed member loses access immediately"
// (§2) hold here too, not just on direct ticket/project reads.
export async function listMyTickets(
  actor: Actor,
  deps: TicketServiceDeps,
  cursor?: string | null,
  limit?: number,
): Promise<Page<TicketRow>> {
  const page = await deps.tickets.listTicketsAssignedToUser(actor.userId, cursor, limit);
  const roleCache = new Map<string, boolean>();
  const visible: TicketRow[] = [];

  for (const ticket of page.data) {
    let hasAccess = roleCache.get(ticket.projectId);
    if (hasAccess === undefined) {
      hasAccess = (await resolveProjectRole(deps, actor, ticket.projectId)) !== null;
      roleCache.set(ticket.projectId, hasAccess);
    }
    if (hasAccess) visible.push(ticket);
  }

  return { data: visible, nextCursor: page.nextCursor };
}

export async function updateTicket(
  actor: Actor,
  ticketId: string,
  patch: TicketPatchInput,
  deps: TicketServiceDeps,
): Promise<TicketRow> {
  const existing = await deps.tickets.findTicketById(ticketId);
  if (!existing) throw new NotFoundError("Ticket not found");
  await requireProjectRole(deps, actor, existing.projectId, "ticket:update");
  if (patch.assigneeId) await assertAssignable(deps, patch.assigneeId, existing.projectId);

  const { version, ...fields } = patch;
  const updated = await deps.tickets.updateTicketIfVersionMatches(ticketId, version, fields, actor.userId);
  if (!updated) {
    throw new StaleStateError({ ticketId, expectedVersion: version });
  }

  // A dedicated event, not just a generic ticket.updated, for the one field
  // change the WS contract calls out by name (§4).
  if (fields.assigneeId !== undefined && fields.assigneeId !== existing.assigneeId) {
    deps.eventBus.publish({
      event: "ticket.assigned",
      projectId: updated.projectId,
      ticketId: updated.id,
      data: { assigneeId: fields.assigneeId },
      actor: { userId: actor.userId, actorType: "user" },
    });
  }

  deps.eventBus.publish({
    event: "ticket.updated",
    projectId: updated.projectId,
    ticketId: updated.id,
    data: { ticket: updated, changed: fields },
    actor: { userId: actor.userId, actorType: "user" },
  });

  return updated;
}

export async function transitionTicket(
  actor: Actor,
  ticketId: string,
  input: TransitionInput,
  deps: TicketServiceDeps,
): Promise<TicketRow> {
  const existing = await deps.tickets.findTicketById(ticketId);
  if (!existing) throw new NotFoundError("Ticket not found");
  await requireProjectRole(deps, actor, existing.projectId, "ticket:transition");

  const transitions = await deps.workflow.listWorkflowTransitions(existing.projectId);
  if (!isTransitionAllowed(existing.stateId, input.toStateId, transitions)) {
    throw new IllegalTransitionError({ fromStateId: existing.stateId, toStateId: input.toStateId });
  }

  const updated = await deps.tickets.transitionTicketState(ticketId, existing.stateId, input.toStateId, input.version, actor.userId);
  if (!updated) {
    throw new StaleStateError({ ticketId, expectedVersion: input.version });
  }

  deps.eventBus.publish({
    event: "ticket.transitioned",
    projectId: updated.projectId,
    ticketId: updated.id,
    data: { fromStateId: existing.stateId, toStateId: input.toStateId },
    actor: { userId: actor.userId, actorType: "user" },
  });

  return updated;
}

export async function listTicketEvents(
  actor: Actor,
  ticketId: string,
  deps: TicketServiceDeps,
  cursor?: string | null,
  limit?: number,
): Promise<Page<TicketEventRow>> {
  const ticket = await deps.tickets.findTicketById(ticketId);
  if (!ticket) throw new NotFoundError("Ticket not found");
  await requireProjectRole(deps, actor, ticket.projectId, "ticket:read");
  return deps.tickets.listTicketEvents(ticketId, cursor, limit);
}
