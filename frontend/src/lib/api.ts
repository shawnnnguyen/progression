import { env } from "@/config/env";
import { getAccessToken, getOrStartRefresh, setAccessToken } from "./authToken";

export class AuthSessionExpiredError extends Error {
  constructor() {
    super("Session expired — please sign in again");
    this.name = "AuthSessionExpiredError";
  }
}

function isAuthRoute(path: string): boolean {
  return path.startsWith("/auth/");
}

async function rawFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = getAccessToken();
  return fetch(`${env.apiUrl}/api/v1${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
}

// Deliberately bypasses apiFetch/rawFetch's Authorization header (refresh
// relies on the httpOnly cookie, not a bearer token) and lives outside
// authApi.ts to avoid a circular import (authApi.ts imports apiFetch from
// this module).
async function refreshAccessToken(): Promise<string> {
  const res = await fetch(`${env.apiUrl}/api/v1/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new AuthSessionExpiredError();
  const body = (await res.json()) as { data: { accessToken: string } };
  setAccessToken(body.data.accessToken);
  return body.data.accessToken;
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let res = await rawFetch(path, init);

  if (res.status === 401 && !isAuthRoute(path)) {
    try {
      await getOrStartRefresh(refreshAccessToken);
    } catch {
      setAccessToken(null);
      throw new AuthSessionExpiredError();
    }
    res = await rawFetch(path, init);
    if (res.status === 401) {
      setAccessToken(null);
      throw new AuthSessionExpiredError();
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error?.message ?? `Request failed: ${res.status}`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}
