import { describe, expect, it } from "vitest";
import {
  isTransitionAllowed,
  SEED_WORKFLOW_STATES,
  SEED_WORKFLOW_TRANSITIONS,
  type WorkflowTransitionRow,
} from "../../src/services/workflowEngine.js";

const transitions: WorkflowTransitionRow[] = [
  { fromStateId: "todo", toStateId: "in-progress" },
  { fromStateId: "in-progress", toStateId: "done" },
];

describe("isTransitionAllowed", () => {
  it("allows a transition present in the list", () => {
    expect(isTransitionAllowed("todo", "in-progress", transitions)).toBe(true);
  });

  it("rejects a transition not present in the list", () => {
    expect(isTransitionAllowed("todo", "done", transitions)).toBe(false);
  });

  it("rejects the reverse of an allowed transition unless also listed", () => {
    expect(isTransitionAllowed("in-progress", "todo", transitions)).toBe(false);
  });

  it("rejects a transition when given an empty list (e.g. wrong project scope)", () => {
    expect(isTransitionAllowed("todo", "in-progress", [])).toBe(false);
  });

  it("does not take a projectId — scoping is entirely the caller's responsibility", () => {
    // The function signature has no projectId parameter; this test exists to
    // document that invariant so a future edit doesn't quietly add one back
    // without moving the scoping responsibility somewhere explicit.
    expect(isTransitionAllowed.length).toBe(3);
  });
});

describe("seed workflow template (v1 fixed policy)", () => {
  it("has exactly one default state", () => {
    const defaults = SEED_WORKFLOW_STATES.filter((s) => s.isDefault);
    expect(defaults).toHaveLength(1);
    expect(defaults[0]?.name).toBe("Todo");
  });

  it("every seed transition references states that exist in the seed states list", () => {
    const stateNames = new Set(SEED_WORKFLOW_STATES.map((s) => s.name));
    for (const transition of SEED_WORKFLOW_TRANSITIONS) {
      expect(stateNames.has(transition.from)).toBe(true);
      expect(stateNames.has(transition.to)).toBe(true);
    }
  });

  it("DONE and CANCELED both have a way back to an active state (not dead ends)", () => {
    const fromDone = SEED_WORKFLOW_TRANSITIONS.some((t) => t.from === "Done");
    const fromCanceled = SEED_WORKFLOW_TRANSITIONS.some((t) => t.from === "Canceled");
    expect(fromDone).toBe(true);
    expect(fromCanceled).toBe(true);
  });

  it("simulated against isTransitionAllowed: Todo -> In Progress -> Done is a legal path", () => {
    const rows: WorkflowTransitionRow[] = SEED_WORKFLOW_TRANSITIONS.map((t) => ({
      fromStateId: t.from,
      toStateId: t.to,
    }));
    expect(isTransitionAllowed("Todo", "In Progress", rows)).toBe(true);
    expect(isTransitionAllowed("In Progress", "Done", rows)).toBe(true);
    expect(isTransitionAllowed("Todo", "Done", rows)).toBe(false);
  });
});
