import { ForbiddenError, NotFoundError } from "../errors/index.js";
import { can, type Actor, type AuthzDeps } from "./authz.js";
import type { EventBus } from "./eventBus.js";
import type { CommentRow, Page } from "./types.js";

export interface CommentRepository {
  findCommentById(commentId: string): Promise<CommentRow | null>;
  findTicketProjectId(ticketId: string): Promise<string | null>;
  listCommentsForTicket(ticketId: string, cursor?: string | null, limit?: number): Promise<Page<CommentRow>>;
  createComment(ticketId: string, authorId: string, body: string): Promise<CommentRow>;
  updateComment(commentId: string, body: string): Promise<CommentRow>;
  deleteComment(commentId: string): Promise<void>;
}

export interface CommentServiceDeps extends AuthzDeps {
  comments: CommentRepository;
  eventBus: EventBus;
}

export async function createComment(
  actor: Actor,
  ticketId: string,
  body: string,
  deps: CommentServiceDeps,
): Promise<CommentRow> {
  const projectId = await deps.comments.findTicketProjectId(ticketId);
  if (!projectId) throw new NotFoundError("Ticket not found");

  const result = await can(deps, actor, "comment:create", { kind: "project", projectId });
  if (result === "NOT_FOUND") throw new NotFoundError("Ticket not found");
  if (result === "FORBIDDEN") throw new ForbiddenError();

  const comment = await deps.comments.createComment(ticketId, actor.userId, body);

  deps.eventBus.publish({
    event: "comment.created",
    projectId,
    ticketId,
    data: { comment },
    actor: { userId: actor.userId, actorType: "user" },
  });

  return comment;
}

export async function listComments(
  actor: Actor,
  ticketId: string,
  deps: CommentServiceDeps,
  cursor?: string | null,
  limit?: number,
): Promise<Page<CommentRow>> {
  const projectId = await deps.comments.findTicketProjectId(ticketId);
  if (!projectId) throw new NotFoundError("Ticket not found");

  const result = await can(deps, actor, "comment:read", { kind: "project", projectId });
  if (result === "NOT_FOUND") throw new NotFoundError("Ticket not found");
  if (result === "FORBIDDEN") throw new ForbiddenError();

  return deps.comments.listCommentsForTicket(ticketId, cursor, limit);
}

export async function updateComment(
  actor: Actor,
  commentId: string,
  body: string,
  deps: CommentServiceDeps,
): Promise<CommentRow> {
  const existing = await deps.comments.findCommentById(commentId);
  if (!existing) throw new NotFoundError("Comment not found");
  const projectId = await deps.comments.findTicketProjectId(existing.ticketId);
  if (!projectId) throw new NotFoundError("Comment not found");

  const result = await can(deps, actor, "comment:update:own", {
    kind: "comment",
    projectId,
    authorId: existing.authorId,
  });
  if (result === "NOT_FOUND") throw new NotFoundError("Comment not found");
  if (result === "FORBIDDEN") throw new ForbiddenError();

  const updated = await deps.comments.updateComment(commentId, body);

  deps.eventBus.publish({
    event: "comment.updated",
    projectId,
    ticketId: existing.ticketId,
    data: { comment: updated },
    actor: { userId: actor.userId, actorType: "user" },
  });

  return updated;
}

export async function deleteComment(actor: Actor, commentId: string, deps: CommentServiceDeps): Promise<void> {
  const existing = await deps.comments.findCommentById(commentId);
  if (!existing) throw new NotFoundError("Comment not found");
  const projectId = await deps.comments.findTicketProjectId(existing.ticketId);
  if (!projectId) throw new NotFoundError("Comment not found");

  const ownResult = await can(deps, actor, "comment:delete:own", {
    kind: "comment",
    projectId,
    authorId: existing.authorId,
  });
  if (ownResult !== "ALLOW") {
    const anyResult = await can(deps, actor, "comment:delete:any", { kind: "comment", projectId, authorId: existing.authorId });
    if (anyResult === "NOT_FOUND") throw new NotFoundError("Comment not found");
    if (anyResult === "FORBIDDEN") throw new ForbiddenError();
  }

  await deps.comments.deleteComment(commentId);

  deps.eventBus.publish({
    event: "comment.deleted",
    projectId,
    ticketId: existing.ticketId,
    data: { commentId },
    actor: { userId: actor.userId, actorType: "user" },
  });
}
