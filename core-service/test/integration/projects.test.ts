import { afterAll, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildTestApp } from "../fixtures/testApp.js";
import { resetDatabase, disconnectDatabase } from "../fixtures/db.js";
import { addOrgMember, authHeader, createOrgWithOwner, createProjectFixture, createUser } from "../fixtures/factories.js";
import { prisma } from "../../src/repositories/prismaClient.js";

let app: FastifyInstance;

beforeEach(async () => {
  await resetDatabase();
  app = await buildTestApp();
});

afterAll(async () => {
  await app?.close();
  await disconnectDatabase();
});

type MemberRow = { userId: string; role: string; source: string; name: string; avatarUrl: string | null };

describe("project member list identity enrichment", () => {
  it("includes name/avatarUrl for an ORG-visibility project's effective members", async () => {
    const owner = await createUser("Olivia Owner");
    const member = await createUser("Max Member");
    const org = await createOrgWithOwner(owner.id, "Acme");
    await addOrgMember(org.id, member.id, "MEMBER");

    const project = await createProjectFixture(org.id, owner.id, { visibility: "ORG" });

    const res = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${project.id}/members`,
      headers: authHeader(owner.id),
    });
    expect(res.statusCode).toBe(200);

    const rows: MemberRow[] = res.json().data;
    const ownerEntry = rows.find((r) => r.userId === owner.id);
    const memberEntry = rows.find((r) => r.userId === member.id);
    expect(ownerEntry?.name).toBe("Olivia Owner");
    expect(ownerEntry?.source).toBe("org");
    expect(memberEntry?.name).toBe("Max Member");
    expect(memberEntry?.avatarUrl).toBeNull();
  });

  it("includes name/avatarUrl for a PRIVATE-visibility project's override-only members", async () => {
    // A PRIVATE project grants no implicit role to anyone without an explicit
    // ProjectMembership override — not even its own org-owner creator (see
    // authz.test.ts: "PRIVATE visibility: no fallback ... even for an org
    // owner"). So the first override has to be seeded directly, the same way
    // addOrgMember bypasses the invite flow for fixture setup.
    const owner = await createUser("Priya Private-Owner");
    const contractor = await createUser("Cara Contractor");
    const org = await createOrgWithOwner(owner.id, "Acme");
    await addOrgMember(org.id, contractor.id, "MEMBER");

    const project = await createProjectFixture(org.id, owner.id, { visibility: "PRIVATE" });
    await prisma.projectMembership.create({
      data: { projectId: project.id, userId: contractor.id, role: "MEMBER" },
    });

    const res = await app.inject({
      method: "GET",
      url: `/api/v1/projects/${project.id}/members`,
      headers: authHeader(contractor.id),
    });
    expect(res.statusCode).toBe(200);

    const rows: MemberRow[] = res.json().data;
    expect(rows).toHaveLength(1);
    const [entry] = rows;
    expect(entry?.userId).toBe(contractor.id);
    expect(entry?.source).toBe("override");
    expect(entry?.name).toBe("Cara Contractor");
    expect(entry?.avatarUrl).toBeNull();
  });
});
