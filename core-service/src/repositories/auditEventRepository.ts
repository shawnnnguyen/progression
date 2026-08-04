import type { Prisma } from "@prisma/client";
import { prisma } from "./prismaClient.js";
import type { AuditEventType } from "../services/types.js";
import { clampLimit, cursorWhereDesc, buildPage } from "./pagination.js";

export const auditEventRepository = {
  async recordAuditEvent(orgId: string, type: AuditEventType, data: Record<string, unknown>, actorUserId: string): Promise<void> {
    await prisma.auditEvent.create({ data: { orgId, type, data: data as Prisma.InputJsonValue, actorUserId } });
  },

  async listAuditEventsForOrg(orgId: string, cursor?: string | null, limit?: number) {
    const take = clampLimit(limit);
    const rows = await prisma.auditEvent.findMany({
      where: { orgId, ...cursorWhereDesc(cursor) },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: take + 1,
    });
    return buildPage(
      rows.map((r) => ({ ...r, data: r.data as Record<string, unknown> })),
      take,
    );
  },
};
