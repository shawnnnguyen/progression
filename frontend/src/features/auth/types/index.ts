export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  deactivatedAt: string | null;
  createdAt: string;
}

export interface LoginResult {
  user: User;
  accessToken: string;
}

export interface RefreshResult {
  accessToken: string;
}
