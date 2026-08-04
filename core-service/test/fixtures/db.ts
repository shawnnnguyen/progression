import { prisma } from "../../src/repositories/prismaClient.js";

// Resets all tables between tests. The plan's stated preference (§6) is
// per-test transaction rollback, but our repositories call the shared
// singleton `prisma` client directly (src/repositories/prismaClient.ts), so
// there's no per-test transaction handle to thread through every repository
// call without a larger dependency-injection rework. TRUNCATE ... CASCADE is
// the pragmatic substitute: it's a single fast statement regardless of row
// count, not a row-by-row DELETE, so it doesn't reintroduce the "slow enough
// to discourage more tests" problem the plan was avoiding.
export async function resetDatabase(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "AuditEvent", "TicketEvent", "Comment", "TicketLabel", "Label",
      "Ticket", "Sprint", "WorkflowTransition", "WorkflowState",
      "ProjectMembership", "Project", "Invite", "RefreshToken",
      "Membership", "Organization", "User"
    RESTART IDENTITY CASCADE
  `);
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}
