import { createContext, useMemo, useState, type ReactNode } from "react";
import { useOrgs } from "../hooks/useOrgs";

export interface CurrentOrgContextValue {
  currentOrgId: string | undefined;
  setCurrentOrgId: (orgId: string) => void;
}

export const CurrentOrgContext = createContext<CurrentOrgContextValue | undefined>(undefined);

export function CurrentOrgProvider({ children }: { children: ReactNode }) {
  const { data: orgs } = useOrgs();
  const [selectedOrgId, setSelectedOrgId] = useState<string | undefined>(undefined);

  const currentOrgId = selectedOrgId ?? orgs?.[0]?.id;

  const value = useMemo<CurrentOrgContextValue>(
    () => ({ currentOrgId, setCurrentOrgId: setSelectedOrgId }),
    [currentOrgId],
  );

  return <CurrentOrgContext.Provider value={value}>{children}</CurrentOrgContext.Provider>;
}
