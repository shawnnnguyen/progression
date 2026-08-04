import { describe, expect, it } from "vitest";
import { can, resolveProjectRole, type Action, type AuthzDeps, type OrgRole, type ProjectRole } from "../../src/services/authz.js";

interface FakeOrg {
  orgId: string;
  visibility: "ORG" | "PRIVATE";
}

function fakeDeps(opts: {
  orgRoles?: Record<string, OrgRole>; // userId -> role, all in the same org
  projectOverrides?: Record<string, ProjectRole>; // userId -> override, all in the same project
  project?: FakeOrg;
}): AuthzDeps {
  const orgRoles = opts.orgRoles ?? {};
  const projectOverrides = opts.projectOverrides ?? {};
  const project = opts.project ?? { orgId: "org-1", visibility: "ORG" };

  return {
    async getOrgRole(userId) {
      return orgRoles[userId] ?? null;
    },
    async getProjectOverride(userId) {
      return projectOverrides[userId] ?? null;
    },
    async getProjectContext() {
      return project;
    },
  };
}

describe("resolveProjectRole", () => {
  it("returns null when the project does not exist", async () => {
    const deps: AuthzDeps = {
      async getOrgRole() {
        return "OWNER";
      },
      async getProjectOverride() {
        return null;
      },
      async getProjectContext() {
        return null;
      },
    };
    expect(await resolveProjectRole(deps, { userId: "u1", actorType: "user" }, "p1")).toBeNull();
  });

  it("returns null when the actor has no active org membership (removed member, full stop)", async () => {
    const deps = fakeDeps({ orgRoles: {}, project: { orgId: "org-1", visibility: "ORG" } });
    expect(await resolveProjectRole(deps, { userId: "gone", actorType: "user" }, "p1")).toBeNull();
  });

  it("ORG visibility: maps org role to project role when no override exists", async () => {
    const deps = fakeDeps({ orgRoles: { u1: "MEMBER" }, project: { orgId: "org-1", visibility: "ORG" } });
    expect(await resolveProjectRole(deps, { userId: "u1", actorType: "user" }, "p1")).toBe("MEMBER");
  });

  it("ORG visibility: OWNER and ADMIN both map to project ADMIN", async () => {
    const ownerDeps = fakeDeps({ orgRoles: { u1: "OWNER" } });
    const adminDeps = fakeDeps({ orgRoles: { u1: "ADMIN" } });
    expect(await resolveProjectRole(ownerDeps, { userId: "u1", actorType: "user" }, "p1")).toBe("ADMIN");
    expect(await resolveProjectRole(adminDeps, { userId: "u1", actorType: "user" }, "p1")).toBe("ADMIN");
  });

  it("PRIVATE visibility: no fallback without an explicit override, even for an org owner", async () => {
    const deps = fakeDeps({ orgRoles: { u1: "OWNER" }, project: { orgId: "org-1", visibility: "PRIVATE" } });
    expect(await resolveProjectRole(deps, { userId: "u1", actorType: "user" }, "p1")).toBeNull();
  });

  it("PRIVATE visibility: an explicit override grants access", async () => {
    const deps = fakeDeps({
      orgRoles: { u1: "MEMBER" },
      projectOverrides: { u1: "ADMIN" },
      project: { orgId: "org-1", visibility: "PRIVATE" },
    });
    expect(await resolveProjectRole(deps, { userId: "u1", actorType: "user" }, "p1")).toBe("ADMIN");
  });

  it("override wins over the ORG-visibility fallback mapping", async () => {
    const deps = fakeDeps({ orgRoles: { u1: "MEMBER" }, projectOverrides: { u1: "VIEWER" } });
    expect(await resolveProjectRole(deps, { userId: "u1", actorType: "user" }, "p1")).toBe("VIEWER");
  });

  it("an org OWNER is never downgraded below ADMIN by a project override", async () => {
    const deps = fakeDeps({ orgRoles: { u1: "OWNER" }, projectOverrides: { u1: "VIEWER" } });
    expect(await resolveProjectRole(deps, { userId: "u1", actorType: "user" }, "p1")).toBe("ADMIN");
  });
});

describe("can() — org-level actions", () => {
  const cases: Array<{ role: OrgRole; action: Action; expected: "ALLOW" | "FORBIDDEN" }> = [
    { role: "OWNER", action: "org:update", expected: "ALLOW" },
    { role: "ADMIN", action: "org:update", expected: "FORBIDDEN" },
    { role: "MEMBER", action: "org:update", expected: "FORBIDDEN" },
    { role: "VIEWER", action: "org:update", expected: "FORBIDDEN" },
    { role: "OWNER", action: "org:member:invite", expected: "ALLOW" },
    { role: "ADMIN", action: "org:member:invite", expected: "ALLOW" },
    { role: "MEMBER", action: "org:member:invite", expected: "FORBIDDEN" },
    { role: "VIEWER", action: "org:read", expected: "ALLOW" },
    { role: "OWNER", action: "project:create", expected: "ALLOW" },
    { role: "ADMIN", action: "project:create", expected: "ALLOW" },
    { role: "MEMBER", action: "project:create", expected: "FORBIDDEN" },
  ];

  for (const { role, action, expected } of cases) {
    it(`${role} on ${action} -> ${expected}`, async () => {
      const deps = fakeDeps({ orgRoles: { u1: role } });
      const result = await can(deps, { userId: "u1", actorType: "user" }, action, { kind: "org", orgId: "org-1" });
      expect(result).toBe(expected);
    });
  }

  it("returns NOT_FOUND for a caller with no membership in the org (cross-org enumeration protection)", async () => {
    const deps = fakeDeps({ orgRoles: {} });
    const result = await can(deps, { userId: "stranger", actorType: "user" }, "org:read", { kind: "org", orgId: "org-1" });
    expect(result).toBe("NOT_FOUND");
  });

  it("an ADMIN cannot change the role of an OWNER row", async () => {
    const deps = fakeDeps({ orgRoles: { u1: "ADMIN" } });
    const result = await can(deps, { userId: "u1", actorType: "user" }, "org:member:role:change", {
      kind: "org",
      orgId: "org-1",
      targetOrgRole: "OWNER",
    });
    expect(result).toBe("FORBIDDEN");
  });

  it("an ADMIN cannot remove an OWNER row", async () => {
    const deps = fakeDeps({ orgRoles: { u1: "ADMIN" } });
    const result = await can(deps, { userId: "u1", actorType: "user" }, "org:member:remove", {
      kind: "org",
      orgId: "org-1",
      targetOrgRole: "OWNER",
    });
    expect(result).toBe("FORBIDDEN");
  });

  it("an OWNER can change the role of another OWNER row", async () => {
    const deps = fakeDeps({ orgRoles: { u1: "OWNER" } });
    const result = await can(deps, { userId: "u1", actorType: "user" }, "org:member:role:change", {
      kind: "org",
      orgId: "org-1",
      targetOrgRole: "OWNER",
    });
    expect(result).toBe("ALLOW");
  });
});

describe("can() — project-level actions, full role x action matrix", () => {
  const projectActions: Action[] = [
    "project:read",
    "project:update",
    "ticket:read",
    "ticket:create",
    "ticket:update",
    "ticket:transition",
    "label:read",
    "label:create",
    "sprint:read",
    "sprint:create",
    "comment:read",
    "comment:create",
  ];

  const minRoleFor: Partial<Record<Action, ProjectRole>> = {
    "project:read": "VIEWER",
    "project:update": "ADMIN",
    "ticket:read": "VIEWER",
    "ticket:create": "MEMBER",
    "ticket:update": "MEMBER",
    "ticket:transition": "MEMBER",
    "label:read": "VIEWER",
    "label:create": "ADMIN",
    "sprint:read": "VIEWER",
    "sprint:create": "ADMIN",
    "comment:read": "VIEWER",
    "comment:create": "MEMBER",
  };

  const rank: Record<ProjectRole, number> = { VIEWER: 0, MEMBER: 1, ADMIN: 2 };
  const orgRolesToTest: OrgRole[] = ["VIEWER", "MEMBER", "ADMIN", "OWNER"];

  function orgRoleToProjectRole(role: OrgRole): ProjectRole {
    if (role === "OWNER" || role === "ADMIN") return "ADMIN";
    if (role === "MEMBER") return "MEMBER";
    return "VIEWER";
  }

  for (const orgRole of orgRolesToTest) {
    for (const action of projectActions) {
      const effectiveRole = orgRoleToProjectRole(orgRole);
      const required = minRoleFor[action]!;
      const expected = rank[effectiveRole] >= rank[required] ? "ALLOW" : "FORBIDDEN";

      it(`org role ${orgRole} (no override) on ${action} -> ${expected}`, async () => {
        const deps = fakeDeps({ orgRoles: { u1: orgRole } });
        const result = await can(deps, { userId: "u1", actorType: "user" }, action, { kind: "project", projectId: "p1" });
        expect(result).toBe(expected);
      });
    }
  }

  it("a VIEWER attempting to create a ticket is FORBIDDEN, not silently downgraded", async () => {
    const deps = fakeDeps({ orgRoles: { u1: "VIEWER" } });
    const result = await can(deps, { userId: "u1", actorType: "user" }, "ticket:create", { kind: "project", projectId: "p1" });
    expect(result).toBe("FORBIDDEN");
  });

  it("cross-org project access is NOT_FOUND, not FORBIDDEN", async () => {
    const deps = fakeDeps({ orgRoles: {} });
    const result = await can(deps, { userId: "stranger", actorType: "user" }, "project:read", {
      kind: "project",
      projectId: "p1",
    });
    expect(result).toBe("NOT_FOUND");
  });

  it("a PRIVATE project with no override is NOT_FOUND for an org member without one", async () => {
    const deps = fakeDeps({ orgRoles: { u1: "MEMBER" }, project: { orgId: "org-1", visibility: "PRIVATE" } });
    const result = await can(deps, { userId: "u1", actorType: "user" }, "project:read", { kind: "project", projectId: "p1" });
    expect(result).toBe("NOT_FOUND");
  });
});

describe("can() — comment ownership", () => {
  it("a MEMBER can update their own comment", async () => {
    const deps = fakeDeps({ orgRoles: { u1: "MEMBER" } });
    const result = await can(deps, { userId: "u1", actorType: "user" }, "comment:update:own", {
      kind: "comment",
      projectId: "p1",
      authorId: "u1",
    });
    expect(result).toBe("ALLOW");
  });

  it("a MEMBER cannot update someone else's comment via the :own action", async () => {
    const deps = fakeDeps({ orgRoles: { u1: "MEMBER" } });
    const result = await can(deps, { userId: "u1", actorType: "user" }, "comment:update:own", {
      kind: "comment",
      projectId: "p1",
      authorId: "someone-else",
    });
    expect(result).toBe("FORBIDDEN");
  });

  it("a project ADMIN can delete any comment via :any", async () => {
    const deps = fakeDeps({ orgRoles: { u1: "ADMIN" } });
    const result = await can(deps, { userId: "u1", actorType: "user" }, "comment:delete:any", {
      kind: "comment",
      projectId: "p1",
      authorId: "someone-else",
    });
    expect(result).toBe("ALLOW");
  });

  it("a MEMBER cannot delete someone else's comment via :any", async () => {
    const deps = fakeDeps({ orgRoles: { u1: "MEMBER" } });
    const result = await can(deps, { userId: "u1", actorType: "user" }, "comment:delete:any", {
      kind: "comment",
      projectId: "p1",
      authorId: "someone-else",
    });
    expect(result).toBe("FORBIDDEN");
  });

  it("a VIEWER cannot update even their own comment (never should have been able to create one)", async () => {
    const deps = fakeDeps({ orgRoles: { u1: "VIEWER" } });
    const result = await can(deps, { userId: "u1", actorType: "user" }, "comment:update:own", {
      kind: "comment",
      projectId: "p1",
      authorId: "u1",
    });
    expect(result).toBe("FORBIDDEN");
  });
});
