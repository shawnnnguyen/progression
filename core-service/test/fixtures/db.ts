import { prisma } from "../../src/repositories/prismaClient.js";

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
