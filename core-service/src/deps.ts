import { config } from "./config.js";
import { EventBus } from "./services/eventBus.js";
import type { AuthServiceDeps } from "./services/authService.js";
import type { MembershipServiceDeps } from "./services/membershipService.js";
import type { ProjectServiceDeps } from "./services/projectService.js";
import type { TicketServiceDeps } from "./services/ticketService.js";
import type { CommentServiceDeps } from "./services/commentService.js";
import type { LabelServiceDeps } from "./services/labelService.js";
import type { SprintServiceDeps } from "./services/sprintService.js";
import type { WorkflowServiceDeps } from "./services/workflowService.js";

import { authzRepository } from "./repositories/authzRepository.js";
import { orgRepository } from "./repositories/orgRepository.js";
import { membershipRepository } from "./repositories/membershipRepository.js";
import { inviteRepository } from "./repositories/inviteRepository.js";
import { projectRepository } from "./repositories/projectRepository.js";
import { ticketRepository } from "./repositories/ticketRepository.js";
import { commentRepository } from "./repositories/commentRepository.js";
import { labelRepository } from "./repositories/labelRepository.js";
import { sprintRepository } from "./repositories/sprintRepository.js";
import { workflowRepository } from "./repositories/workflowRepository.js";
import { auditEventRepository } from "./repositories/auditEventRepository.js";
import { userRepository } from "./repositories/userRepository.js";
import { refreshTokenRepository } from "./repositories/refreshTokenRepository.js";

export const eventBus = new EventBus();

export const membershipDeps: MembershipServiceDeps = {
  ...authzRepository,
  orgs: orgRepository,
  memberships: membershipRepository,
  invites: inviteRepository,
  auditLog: auditEventRepository,
  users: userRepository,
  refreshTokens: refreshTokenRepository,
};

export const projectDeps: ProjectServiceDeps = {
  ...authzRepository,
  projects: projectRepository,
  auditLog: auditEventRepository,
};

export const ticketDeps: TicketServiceDeps = {
  ...authzRepository,
  tickets: ticketRepository,
  workflow: workflowRepository,
  eventBus,
};

export const commentDeps: CommentServiceDeps = {
  ...authzRepository,
  comments: commentRepository,
  eventBus,
};

export const labelDeps: LabelServiceDeps = {
  ...authzRepository,
  labels: labelRepository,
};

export const sprintDeps: SprintServiceDeps = {
  ...authzRepository,
  sprints: sprintRepository,
  eventBus,
};

export const workflowDeps: WorkflowServiceDeps = {
  ...authzRepository,
  workflow: workflowRepository,
};

export const authDeps: AuthServiceDeps = {
  users: userRepository,
  refreshTokens: refreshTokenRepository,
  config: config.jwt,
};

export { auditEventRepository, authzRepository };
