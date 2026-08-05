import { useContext } from "react";
import { CurrentUserContext, type CurrentUserContextValue } from "../context/current-user-context";

export function useCurrentUser(): CurrentUserContextValue {
  const ctx = useContext(CurrentUserContext);
  if (!ctx) throw new Error("useCurrentUser must be used within a CurrentUserProvider");
  return ctx;
}
