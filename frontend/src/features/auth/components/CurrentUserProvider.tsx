import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMe } from "../api/authApi";
import { devAutoLogin } from "../lib/devAutoLogin";
import { CurrentUserContext } from "../context/current-user-context";
import type { User } from "../types";

async function fetchCurrentUser(): Promise<User> {
  await devAutoLogin();
  const { data } = await getMe();
  return data;
}

export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const query = useQuery({
    queryKey: ["me"],
    queryFn: fetchCurrentUser,
    retry: false,
  });

  if (query.isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="flex min-h-svh items-center justify-center text-muted-foreground">
        Sign in required
      </div>
    );
  }

  return (
    <CurrentUserContext.Provider
      value={{ user: query.data, isLoading: false, isError: false, error: null }}
    >
      {children}
    </CurrentUserContext.Provider>
  );
}
