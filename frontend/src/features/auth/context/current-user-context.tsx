import { createContext } from "react";
import type { User } from "../types";

export interface CurrentUserContextValue {
  user: User | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

export const CurrentUserContext = createContext<CurrentUserContextValue | undefined>(undefined);
