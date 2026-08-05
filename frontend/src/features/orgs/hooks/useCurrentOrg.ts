import { useContext } from "react";
import { CurrentOrgContext, type CurrentOrgContextValue } from "../context/current-org-context";

export function useCurrentOrg(): CurrentOrgContextValue {
  const ctx = useContext(CurrentOrgContext);
  if (!ctx) throw new Error("useCurrentOrg must be used within a CurrentOrgProvider");
  return ctx;
}
