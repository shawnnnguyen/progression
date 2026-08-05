import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "../errors/index.js";
import { can, type Actor, type AuthzDeps, type ProjectRole, type ProjectVisibility } from "./authz.js";
import type { AuditEventType, ProjectMembershipRow, ProjectRow } from "./types.js";

export interface CreateProjectInput {
  key: string;
  name: string;
  description?: string | null;
  visibility?: ProjectVisibility;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string | null;
  visibility?: ProjectVisibility;
}

export interface EffectiveProjectMember {
  userId: string;
  role: ProjectRole;
  source: "override" | "org";
  name: string;
  avatarUrl: string | null;
}

export interface ProjectRepository {
  findProjectById(projectId: string): Promise<ProjectRow | null>;
  findProjectByOrgAndKey(orgId: string, key: string): Promise<ProjectRow | null>;
  /** Visible to the caller only — filtered by visibility/membership, not just org membership (§4). */
  listVisibleProjectsForOrg(orgId: string, actorUserId: string): Promise<ProjectRow[]>;
  /** Creates the project and seeds its default workflow states/transitions in one transaction. */
  createProject(orgId: string, input: CreateProjectInput): Promise<ProjectRow>;
  updateProject(projectId: string, patch: UpdateProjectInput): Promise<ProjectRow>;
  archiveProject(projectId: string): Promise<ProjectRow>;
  listEffectiveProjectMembers(projectId: string): Promise<EffectiveProjectMember[]>;
  setProjectMemberOverride(projectId: string, userId: string, role: ProjectRole): Promise<ProjectMembershipRow>;
  removeProjectMemberOverride(projectId: string, userId: string): Promise<void>;
  isActiveOrgMember(orgId: string, userId: string): Promise<boolean>;
}

export interface AuditEventRepository {
  recordAuditEvent(orgId: string, type: AuditEventType, data: Record<string, unknown>, actorUserId: string): Promise<void>;
}

export interface ProjectServiceDeps extends AuthzDeps {
  projects: ProjectRepository;
  auditLog: AuditEventRepository;
}

const KEY_PATTERN = /^[A-Z][A-Z0-9]{1,9}$/;

export async function createProject(actor: Actor, orgId: string, input: CreateProjectInput, deps: ProjectServiceDeps): Promise<ProjectRow> {
  const result = await can(deps, actor, "project:create", { kind: "org", orgId });
  if (result === "NOT_FOUND") throw new NotFoundError("Organization not found");
  if (result === "FORBIDDEN") throw new ForbiddenError();

  if (!KEY_PATTERN.test(input.key)) {
    throw new ValidationError("Project key must be 2-10 uppercase letters/digits starting with a letter");
  }
  if (await deps.projects.findProjectByOrgAndKey(orgId, input.key)) {
    throw new ConflictError("A project with this key already exists in this org");
  }

  const project = await deps.projects.createProject(orgId, input);
  await deps.auditLog.recordAuditEvent(orgId, "PROJECT_CREATED", { projectId: project.id, key: project.key }, actor.userId);
  return project;
}

export async function listProjects(actor: Actor, orgId: string, deps: ProjectServiceDeps): Promise<ProjectRow[]> {
  const result = await can(deps, actor, "org:read", { kind: "org", orgId });
  if (result === "NOT_FOUND") throw new NotFoundError("Organization not found");
  if (result === "FORBIDDEN") throw new ForbiddenError();
  return deps.projects.listVisibleProjectsForOrg(orgId, actor.userId);
}

async function requireProjectRole(deps: ProjectServiceDeps, actor: Actor, projectId: string, action: "project:read" | "project:update" | "project:archive" | "project:member:read" | "project:member:override:set" | "project:member:override:remove") {
  const result = await can(deps, actor, action, { kind: "project", projectId });
  if (result === "NOT_FOUND") throw new NotFoundError("Project not found");
  if (result === "FORBIDDEN") throw new ForbiddenError();
}

export async function getProject(actor: Actor, projectId: string, deps: ProjectServiceDeps): Promise<ProjectRow> {
  await requireProjectRole(deps, actor, projectId, "project:read");
  const project = await deps.projects.findProjectById(projectId);
  if (!project) throw new NotFoundError("Project not found");
  return project;
}

export async function updateProject(
  actor: Actor,
  projectId: string,
  patch: UpdateProjectInput,
  deps: ProjectServiceDeps,
): Promise<ProjectRow> {
  await requireProjectRole(deps, actor, projectId, "project:update");
  return deps.projects.updateProject(projectId, patch);
}

export async function archiveProject(actor: Actor, projectId: string, deps: ProjectServiceDeps): Promise<ProjectRow> {
  await requireProjectRole(deps, actor, projectId, "project:archive");
  const project = await deps.projects.findProjectById(projectId);
  if (!project) throw new NotFoundError("Project not found");
  const archived = await deps.projects.archiveProject(projectId);
  await deps.auditLog.recordAuditEvent(project.orgId, "PROJECT_ARCHIVED", { projectId }, actor.userId);
  return archived;
}

export async function listProjectMembers(
  actor: Actor,
  projectId: string,
  deps: ProjectServiceDeps,
): Promise<EffectiveProjectMember[]> {
  await requireProjectRole(deps, actor, projectId, "project:member:read");
  return deps.projects.listEffectiveProjectMembers(projectId);
}

export async function setProjectMemberOverride(
  actor: Actor,
  projectId: string,
  targetUserId: string,
  role: ProjectRole,
  deps: ProjectServiceDeps,
): Promise<ProjectMembershipRow> {
  await requireProjectRole(deps, actor, projectId, "project:member:override:set");

  const project = await deps.projects.findProjectById(projectId);
  if (!project) throw new NotFoundError("Project not found");

  if (!(await deps.projects.isActiveOrgMember(project.orgId, targetUserId))) {
    throw new ValidationError("Target user must already be an active member of this project's org");
  }

  const override = await deps.projects.setProjectMemberOverride(projectId, targetUserId, role);
  await deps.auditLog.recordAuditEvent(
    project.orgId,
    "PROJECT_ROLE_OVERRIDE_SET",
    { projectId, targetUserId, role },
    actor.userId,
  );
  return override;
}

export async function removeProjectMemberOverride(
  actor: Actor,
  projectId: string,
  targetUserId: string,
  deps: ProjectServiceDeps,
): Promise<void> {
  await requireProjectRole(deps, actor, projectId, "project:member:override:remove");

  const project = await deps.projects.findProjectById(projectId);
  if (!project) throw new NotFoundError("Project not found");

  await deps.projects.removeProjectMemberOverride(projectId, targetUserId);
  await deps.auditLog.recordAuditEvent(
    project.orgId,
    "PROJECT_ROLE_OVERRIDE_REMOVED",
    { projectId, targetUserId },
    actor.userId,
  );
}
