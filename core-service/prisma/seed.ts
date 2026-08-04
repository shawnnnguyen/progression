import { register } from "../src/services/authService.js";
import { createOrg } from "../src/services/membershipService.js";
import { createProject } from "../src/services/projectService.js";
import { createTicket } from "../src/services/ticketService.js";
import { authDeps, membershipDeps, projectDeps, ticketDeps } from "../src/deps.js";
import { prisma } from "../src/repositories/prismaClient.js";
import type { Actor } from "../src/services/authz.js";

async function main() {
  const owner = await register({ email: "owner@example.com", name: "Olivia Owner", password: "password123!" }, authDeps);
  const member = await register({ email: "member@example.com", name: "Max Member", password: "password123!" }, authDeps);

  const ownerActor: Actor = { userId: owner.id, actorType: "user" };

  const org = await createOrg(ownerActor, "Acme Corp", "acme-corp", membershipDeps);
  await prisma.membership.create({ data: { userId: member.id, orgId: org.id, role: "MEMBER" } });

  const project = await createProject(ownerActor, org.id, { key: "ENG", name: "Engineering" }, projectDeps);

  await createTicket(ownerActor, { projectId: project.id, title: "Set up CI pipeline", priority: "HIGH" }, ticketDeps);
  await createTicket(
    ownerActor,
    { projectId: project.id, title: "Write onboarding docs", priority: "LOW", assigneeId: member.id },
    ticketDeps,
  );

  console.log("Seeded:");
  console.log(`  Org:     ${org.name} (${org.id})`);
  console.log(`  Project: ${project.key} - ${project.name} (${project.id})`);
  console.log(`  Owner:   ${owner.email} / password123!`);
  console.log(`  Member:  ${member.email} / password123!`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
