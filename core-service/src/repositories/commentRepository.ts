import { prisma } from "./prismaClient.js";
import { clampLimit, cursorWhereDesc, buildPage } from "./pagination.js";
import type { CommentRepository } from "../services/commentService.js";

export const commentRepository: CommentRepository = {
  async findCommentById(commentId) {
    return prisma.comment.findUnique({ where: { id: commentId } });
  },

  async findTicketProjectId(ticketId) {
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId }, select: { projectId: true } });
    return ticket?.projectId ?? null;
  },

  async listCommentsForTicket(ticketId, cursor, limit) {
    const take = clampLimit(limit);
    const rows = await prisma.comment.findMany({
      where: { ticketId, ...(cursorWhereDesc(cursor) ?? {}) },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: take + 1,
    });
    return buildPage(rows, take);
  },

  async createComment(ticketId, authorId, body) {
    return prisma.$transaction(async (tx) => {
      const comment = await tx.comment.create({ data: { ticketId, authorId, body } });
      await tx.ticketEvent.create({
        data: { ticketId, type: "COMMENTED", data: { commentId: comment.id }, actorUserId: authorId },
      });
      return comment;
    });
  },

  async updateComment(commentId, body) {
    return prisma.comment.update({ where: { id: commentId }, data: { body, editedAt: new Date() } });
  },

  async deleteComment(commentId) {
    await prisma.comment.delete({ where: { id: commentId } });
  },
};
