import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "./prismaClient.js";
import { SEED_WORKFLOW_STATES, SEED_WORKFLOW_TRANSITIONS } from "../services/workflowEngine.js";

export const workflowRepository = {
  async listWorkflowStates(projectId: string) {
    return prisma.workflowState.findMany({ where: { projectId }, orderBy: { position: "asc" } });
  },

  async listWorkflowTransitions(projectId: string) {
    return prisma.workflowTransition.findMany({ where: { projectId } });
  },
};

export async function seedDefaultWorkflow(
  tx: Prisma.TransactionClient | PrismaClient,
  projectId: string,
): Promise<void> {
  const idByName = new Map<string, string>();

  for (const state of SEED_WORKFLOW_STATES) {
    const created = await tx.workflowState.create({
      data: {
        projectId,
        name: state.name,
        category: state.category,
        position: state.position,
        isDefault: state.isDefault,
      },
    });
    idByName.set(state.name, created.id);
  }

  for (const transition of SEED_WORKFLOW_TRANSITIONS) {
    const fromStateId = idByName.get(transition.from);
    const toStateId = idByName.get(transition.to);
    if (!fromStateId || !toStateId) {
      throw new Error(`Seed workflow transition references unknown state: ${transition.from} -> ${transition.to}`);
    }
    await tx.workflowTransition.create({ data: { projectId, fromStateId, toStateId } });
  }
}
