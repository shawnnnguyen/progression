import { apiFetch } from "@/lib/api";
import type { LoginResult, RefreshResult, User } from "../types";

export function register(input: { email: string; name: string; password: string }) {
  return apiFetch<{ data: User }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function login(input: { email: string; password: string }) {
  return apiFetch<{ data: LoginResult }>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function refresh() {
  return apiFetch<{ data: RefreshResult }>("/auth/refresh", { method: "POST" });
}

export function logout() {
  return apiFetch<void>("/auth/logout", { method: "POST" });
}

export function getMe() {
  return apiFetch<{ data: User }>("/me");
}
