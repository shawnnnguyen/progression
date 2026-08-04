import { describe, expect, it, beforeEach } from "vitest";
import {
  createTicket,
  getTicket,
  transitionTicket,
  updateTicket,
  type TicketServiceDeps,
} from "../../src/services/ticketService.js";
import { EventBus } from "../../src/services/eventBus.js";
import { ForbiddenError, IllegalTransitionError, NotFoundError, StaleStateError } from "../../src/errors/index.js";
import type { TicketRow } from "../../src/services/types.js";

const PROJECT_ID = "proj-1";
const DEFAULT_STATE_ID = "state-todo";
const IN_PROGRESS_STATE_ID = "state-in-progress";
const DONE_STATE_ID = "state-done";

function makeTicket(overrides: Partial<TicketRow> = {}): TicketRow {
  return {
    id: "ticket-1",
    projectId: PROJECT_ID,
    number: 1,
    title: "Fix the thing",
    description: null,
    priority: "NONE",
    stateId: DEFAULT_STATE_ID,
    assigneeId: null,
    reporterId: "reporter-1",
    sprintId: null,
    version: 0,
    archivedAt: null,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  };
}

function makeDeps(opts: { orgRole?: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER"; tickets?: TicketRow[] } = {}): {
  deps: TicketServiceDeps;
  tickets: Map<string, TicketRow>;
} {
  const orgRole = opts.orgRole ?? "MEMBER";
  const ticketsMap = new Map<string, TicketRow>((opts.tickets ?? []).map((t) => [t.id, t]));

  const deps: TicketServiceDeps = {
    async getOrgRole() {
      return orgRole;
    },
    async getProjectOverride() {
      return null;
    },
    async getProjectContext() {
      return { orgId: "org-1", visibility: "ORG" };
    },
    tickets: {
      async findTicketById(ticketId) {
        return ticketsMap.get(ticketId) ?? null;
      },
      async listTickets() {
        return { data: [...ticketsMap.values()], nextCursor: null };
      },
      async listTicketsAssignedToUser() {
        return { data: [], nextCursor: null };
      },
      async createTicket(input, defaultStateId) {
        const ticket = makeTicket({
          id: `ticket-${ticketsMap.size + 1}`,
          title: input.title,
          description: input.description ?? null,
          priority: input.priority ?? "NONE",
          assigneeId: input.assigneeId ?? null,
          reporterId: input.reporterId,
          stateId: defaultStateId,
          projectId: input.projectId,
        });
        ticketsMap.set(ticket.id, ticket);
        return ticket;
      },
      async updateTicketIfVersionMatches(ticketId, expectedVersion, patch) {
        const current = ticketsMap.get(ticketId);
        if (!current || current.version !== expectedVersion) return null;
        const updated = { ...current, ...patch, version: current.version + 1 };
        ticketsMap.set(ticketId, updated);
        return updated;
      },
      async transitionTicketState(ticketId, fromStateId, toStateId, expectedVersion) {
        const current = ticketsMap.get(ticketId);
        if (!current || current.stateId !== fromStateId || current.version !== expectedVersion) return null;
        const updated = { ...current, stateId: toStateId, version: current.version + 1 };
        ticketsMap.set(ticketId, updated);
        return updated;
      },
      async listTicketEvents() {
        return { data: [], nextCursor: null };
      },
    },
    workflow: {
      async listWorkflowStates() {
        return [
          { id: DEFAULT_STATE_ID, isDefault: true },
          { id: IN_PROGRESS_STATE_ID, isDefault: false },
          { id: DONE_STATE_ID, isDefault: false },
        ];
      },
      async listWorkflowTransitions() {
        return [
          { fromStateId: DEFAULT_STATE_ID, toStateId: IN_PROGRESS_STATE_ID },
          { fromStateId: IN_PROGRESS_STATE_ID, toStateId: DONE_STATE_ID },
        ];
      },
    },
    eventBus: new EventBus(),
  };

  return { deps, tickets: ticketsMap };
}

const actor = { userId: "u1", actorType: "user" as const };

describe("createTicket", () => {
  it("creates a ticket in the project's default workflow state", async () => {
    const { deps } = makeDeps({ orgRole: "MEMBER" });
    const ticket = await createTicket(actor, { projectId: PROJECT_ID, title: "New ticket" }, deps);
    expect(ticket.stateId).toBe(DEFAULT_STATE_ID);
    expect(ticket.title).toBe("New ticket");
  });

  it("rejects a VIEWER attempting to create a ticket", async () => {
    const { deps } = makeDeps({ orgRole: "VIEWER" });
    await expect(createTicket(actor, { projectId: PROJECT_ID, title: "Nope" }, deps)).rejects.toThrow(ForbiddenError);
  });

  it("throws NotFoundError for a project the actor has no visibility into", async () => {
    const { deps } = makeDeps({ orgRole: "MEMBER" });
    deps.getProjectContext = async () => null;
    await expect(createTicket(actor, { projectId: "ghost", title: "x" }, deps)).rejects.toThrow(NotFoundError);
  });
});

describe("getTicket", () => {
  it("throws NotFoundError for a nonexistent ticket", async () => {
    const { deps } = makeDeps();
    await expect(getTicket(actor, "missing", deps)).rejects.toThrow(NotFoundError);
  });

  it("returns the ticket when the actor has read access", async () => {
    const ticket = makeTicket();
    const { deps } = makeDeps({ tickets: [ticket] });
    const result = await getTicket(actor, ticket.id, deps);
    expect(result.id).toBe(ticket.id);
  });
});

describe("updateTicket", () => {
  let ticket: TicketRow;
  let deps: TicketServiceDeps;

  beforeEach(() => {
    ticket = makeTicket();
    ({ deps } = makeDeps({ tickets: [ticket] }));
  });

  it("applies the patch when the version matches", async () => {
    const updated = await updateTicket(actor, ticket.id, { version: 0, title: "Renamed" }, deps);
    expect(updated.title).toBe("Renamed");
    expect(updated.version).toBe(1);
  });

  it("throws StaleStateError when the version is stale", async () => {
    await expect(updateTicket(actor, ticket.id, { version: 99, title: "Renamed" }, deps)).rejects.toThrow(StaleStateError);
  });

  it("rejects a VIEWER attempting to update a ticket", async () => {
    ({ deps } = makeDeps({ tickets: [ticket], orgRole: "VIEWER" }));
    await expect(updateTicket(actor, ticket.id, { version: 0, title: "Renamed" }, deps)).rejects.toThrow(ForbiddenError);
  });
});

describe("transitionTicket", () => {
  let ticket: TicketRow;
  let deps: TicketServiceDeps;

  beforeEach(() => {
    ticket = makeTicket({ stateId: DEFAULT_STATE_ID, version: 0 });
    ({ deps } = makeDeps({ tickets: [ticket] }));
  });

  it("allows a legal transition and bumps the version", async () => {
    const updated = await transitionTicket(actor, ticket.id, { toStateId: IN_PROGRESS_STATE_ID, version: 0 }, deps);
    expect(updated.stateId).toBe(IN_PROGRESS_STATE_ID);
    expect(updated.version).toBe(1);
  });

  it("rejects an illegal transition with IllegalTransitionError", async () => {
    await expect(transitionTicket(actor, ticket.id, { toStateId: DONE_STATE_ID, version: 0 }, deps)).rejects.toThrow(
      IllegalTransitionError,
    );
  });

  it("rejects a legal transition against a stale version with StaleStateError", async () => {
    await expect(
      transitionTicket(actor, ticket.id, { toStateId: IN_PROGRESS_STATE_ID, version: 5 }, deps),
    ).rejects.toThrow(StaleStateError);
  });

  it("a client still holding the pre-transition version gets STALE_STATE even for a target that's legal from the new state", async () => {
    // Someone else already moved Todo -> In Progress (version 0 -> 1). A
    // client that read the ticket before that — still believing version 0 —
    // now tries In Progress -> Done. The move is legal from the *current*
    // state, so this exercises the version guard specifically, not
    // isTransitionAllowed().
    await transitionTicket(actor, ticket.id, { toStateId: IN_PROGRESS_STATE_ID, version: 0 }, deps);
    await expect(
      transitionTicket(actor, ticket.id, { toStateId: DONE_STATE_ID, version: 0 }, deps),
    ).rejects.toThrow(StaleStateError);
  });
});
