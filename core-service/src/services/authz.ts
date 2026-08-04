export type OrgRole = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
export type ProjectRole = "ADMIN" | "MEMBER" | "VIEWER";
export type ProjectVisibility = "ORG" | "PRIVATE";

export interface Actor {
  userId: string;
  actorType: "user";
}

export type AuthzResult = "ALLOW" | "FORBIDDEN" | "NOT_FOUND";

export type Action =
  | "org:read"
  | "org:update"
  | "org:member:invite"
  | "org:member:role:change"
  | "org:member:remove"
  | "org:audit:read"
  | "project:create"
  | "project:read"
  | "project:update"
  | "project:archive"
  | "project:member:read"
  | "project:member:override:set"
  | "project:member:override:remove"
  | "workflow:read"
  | "label:create"
  | "label:update"
  | "label:delete"
  | "label:read"
  | "sprint:create"
  | "sprint:update"
  | "sprint:delete"
  | "sprint:read"
  | "ticket:create"
  | "ticket:read"
  | "ticket:update"
  | "ticket:transition"
  | "comment:create"
  | "comment:read"
  | "comment:update:own"
  | "comment:delete:own"
  | "comment:delete:any";

export interface OrgResource {
  kind: "org";
  orgId: string;
  targetOrgRole?: OrgRole;
}

export interface ProjectResource {
  kind: "project";
  projectId: string;
}

export interface CommentResource {
  kind: "comment";
  projectId: string;
  authorId: string;
}

export type Resource = OrgResource | ProjectResource | CommentResource;

export interface AuthzDeps {
  getOrgRole(userId: string, orgId: string): Promise<OrgRole | null>;

  getProjectOverride(userId: string, projectId: string): Promise<ProjectRole | null>;

  getProjectContext(projectId: string): Promise<{ orgId: string; visibility: ProjectVisibility } | null>;
}

const ORG_ROLE_RANK: Record<OrgRole, number> = { VIEWER: 0, MEMBER: 1, ADMIN: 2, OWNER: 3 };
const PROJECT_ROLE_RANK: Record<ProjectRole, number> = { VIEWER: 0, MEMBER: 1, ADMIN: 2 };

function orgRoleToProjectRole(orgRole: OrgRole): ProjectRole {
  if (orgRole === "OWNER" || orgRole === "ADMIN") return "ADMIN";
  if (orgRole === "MEMBER") return "MEMBER";
  return "VIEWER";
}

export async function resolveProjectRole(
  deps: AuthzDeps,
  actor: Actor,
  projectId: string,
): Promise<ProjectRole | null> {
  const project = await deps.getProjectContext(projectId);
  if (!project) return null;

  const orgRole = await deps.getOrgRole(actor.userId, project.orgId);
  if (!orgRole) return null;

  const override = await deps.getProjectOverride(actor.userId, projectId);
  if (override) {
    if (orgRole === "OWNER" && PROJECT_ROLE_RANK[override] < PROJECT_ROLE_RANK.ADMIN) {
      return "ADMIN";
    }
    return override;
  }

  if (project.visibility === "PRIVATE") {
    return null;
  }

  return orgRoleToProjectRole(orgRole);
}

const ORG_ACTION_MIN_ROLE: Partial<Record<Action, OrgRole>> = {
  "org:read": "VIEWER",
  "org:update": "OWNER",
  "org:member:invite": "ADMIN",
  "org:member:role:change": "ADMIN",
  "org:member:remove": "ADMIN",
  "project:create": "ADMIN",
  "org:audit:read": "ADMIN",
};

const PROJECT_ACTION_MIN_ROLE: Partial<Record<Action, ProjectRole>> = {
  "project:read": "VIEWER",
  "project:update": "ADMIN",
  "project:archive": "ADMIN",
  "project:member:read": "VIEWER",
  "project:member:override:set": "ADMIN",
  "project:member:override:remove": "ADMIN",
  "workflow:read": "VIEWER",
  "label:read": "VIEWER",
  "label:create": "ADMIN",
  "label:update": "ADMIN",
  "label:delete": "ADMIN",
  "sprint:read": "VIEWER",
  "sprint:create": "ADMIN",
  "sprint:update": "ADMIN",
  "sprint:delete": "ADMIN",
  "ticket:read": "VIEWER",
  "ticket:create": "MEMBER",
  "ticket:update": "MEMBER",
  "ticket:transition": "MEMBER",
  "comment:read": "VIEWER",
  "comment:create": "MEMBER",
};

export async function can(deps: AuthzDeps, actor: Actor, action: Action, resource: Resource): Promise<AuthzResult> {
  if (resource.kind === "org") {
    const orgRole = await deps.getOrgRole(actor.userId, resource.orgId);
    if (!orgRole) return "NOT_FOUND";

    const required = ORG_ACTION_MIN_ROLE[action];
    if (required === undefined) return "FORBIDDEN";
    if (ORG_ROLE_RANK[orgRole] < ORG_ROLE_RANK[required]) return "FORBIDDEN";

    if (
      (action === "org:member:role:change" || action === "org:member:remove") &&
      resource.targetOrgRole === "OWNER" &&
      orgRole !== "OWNER"
    ) {
      return "FORBIDDEN";
    }

    return "ALLOW";
  }

  if (resource.kind === "project") {
    const projectRole = await resolveProjectRole(deps, actor, resource.projectId);
    if (!projectRole) return "NOT_FOUND";

    const required = PROJECT_ACTION_MIN_ROLE[action];
    if (required === undefined) return "FORBIDDEN";
    if (PROJECT_ROLE_RANK[projectRole] < PROJECT_ROLE_RANK[required]) return "FORBIDDEN";

    return "ALLOW";
  }

  const projectRole = await resolveProjectRole(deps, actor, resource.projectId);
  if (!projectRole) return "NOT_FOUND";

  if (action === "comment:delete:any") {
    return PROJECT_ROLE_RANK[projectRole] >= PROJECT_ROLE_RANK.ADMIN ? "ALLOW" : "FORBIDDEN";
  }

  if (action === "comment:update:own" || action === "comment:delete:own") {
    if (PROJECT_ROLE_RANK[projectRole] < PROJECT_ROLE_RANK.MEMBER) return "FORBIDDEN";
    return resource.authorId === actor.userId ? "ALLOW" : "FORBIDDEN";
  }

  return "FORBIDDEN";
}
