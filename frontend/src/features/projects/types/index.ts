export type ProjectVisibility = "ORG" | "PRIVATE";
export type ProjectRole = "ADMIN" | "MEMBER" | "VIEWER";

export interface ProjectRow {
  id: string;
  orgId: string;
  key: string;
  name: string;
  description: string | null;
  visibility: ProjectVisibility;
  nextTicketNo: number;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EffectiveProjectMember {
  userId: string;
  role: ProjectRole;
  source: "override" | "org";
  name: string;
  avatarUrl: string | null;
}
