export type OrgRole = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";

export interface Org {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrgMember {
  id: string;
  userId: string;
  orgId: string;
  role: OrgRole;
  createdAt: string;
  name: string;
  avatarUrl: string | null;
}
