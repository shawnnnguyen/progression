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

export interface Membership {
  id: string;
  userId: string;
  orgId: string;
  role: OrgRole;
  createdAt: string;
}

export interface Invite {
  id: string;
  orgId: string;
  email: string;
  role: OrgRole;
  invitedById: string;
  expiresAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}
