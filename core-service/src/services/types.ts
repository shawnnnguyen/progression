import type { Action, OrgRole, ProjectRole, ProjectVisibility } from "./authz.js";
export type { OrgRole, ProjectRole, ProjectVisibility, Action };

export type Priority = "NONE" | "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type StateCategory = "BACKLOG" | "TODO" | "INPROGRESS" | "DONE" | "CANCELED";
export type SprintStatus = "PLANNED" | "ACTIVE" | "COMPLETED";

export type TicketEventType =
  | "CREATED"
  | "TITLE_CHANGED"
  | "DESCRIPTION_CHANGED"
  | "STATE_CHANGED"
  | "PRIORITY_CHANGED"
  | "ASSIGNED"
  | "UNASSIGNED"
  | "LABEL_ADDED"
  | "LABEL_REMOVED"
  | "SPRINT_CHANGED"
  | "COMMENTED";

export type AuditEventType =
  | "ORG_ROLE_CHANGED"
  | "ORG_MEMBER_REMOVED"
  | "PROJECT_CREATED"
  | "PROJECT_ARCHIVED"
  | "PROJECT_ROLE_OVERRIDE_SET"
  | "PROJECT_ROLE_OVERRIDE_REMOVED";

export interface UserRow {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  deactivatedAt: Date | null;
  createdAt: Date;
}

export interface OrganizationRow {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MembershipRow {
  id: string;
  userId: string;
  orgId: string;
  role: OrgRole;
  createdAt: Date;
}

export interface InviteRow {
  id: string;
  orgId: string;
  email: string;
  role: OrgRole;
  invitedById: string;
  expiresAt: Date;
  acceptedAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
}

export interface ProjectRow {
  id: string;
  orgId: string;
  key: string;
  name: string;
  description: string | null;
  visibility: ProjectVisibility;
  nextTicketNo: number;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectMembershipRow {
  id: string;
  userId: string;
  projectId: string;
  role: ProjectRole;
  createdAt: Date;
}

export interface WorkflowStateRow {
  id: string;
  projectId: string;
  name: string;
  category: StateCategory;
  position: number;
  isDefault: boolean;
}

export interface WorkflowTransitionRow {
  id: string;
  projectId: string;
  fromStateId: string;
  toStateId: string;
}

export interface TicketRow {
  id: string;
  projectId: string;
  number: number;
  title: string;
  description: string | null;
  priority: Priority;
  stateId: string;
  assigneeId: string | null;
  reporterId: string;
  sprintId: string | null;
  version: number;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TicketEventRow {
  id: string;
  ticketId: string;
  type: TicketEventType;
  data: Record<string, unknown>;
  schemaVersion: number;
  actorUserId: string;
  createdAt: Date;
}

export interface CommentRow {
  id: string;
  ticketId: string;
  authorId: string;
  body: string;
  editedAt: Date | null;
  createdAt: Date;
}

export interface LabelRow {
  id: string;
  projectId: string;
  name: string;
  color: string;
  createdAt: Date;
}

export interface SprintRow {
  id: string;
  projectId: string;
  name: string;
  goal: string | null;
  startDate: Date;
  endDate: Date;
  status: SprintStatus;
  createdAt: Date;
}

export interface AuditEventRow {
  id: string;
  orgId: string;
  type: AuditEventType;
  data: Record<string, unknown>;
  actorUserId: string;
  createdAt: Date;
}

export interface Page<T> {
  data: T[];
  nextCursor: string | null;
}
