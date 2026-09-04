import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navigate, useLocation } from "react-router-dom";
import { getMe } from "../api/authApi";
import { CurrentUserContext } from "../context/current-user-context";
import type { User } from "../types";

async function fetchCurrentUser(): Promise<User> {
  const { data } = await getMe();
  return data;
}

export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
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
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }

  return (
    <CurrentUserContext.Provider
      value={{ user: query.data, isLoading: false, isError: false, error: null }}
    >
      {children}
    </CurrentUserContext.Provider>
  );
}
