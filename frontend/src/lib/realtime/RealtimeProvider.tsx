import { useEffect, type ReactNode } from "react";
import { startRealtime, stopRealtime } from "./connection";

export function RealtimeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    startRealtime();
    return () => stopRealtime();
  }, []);

  return <>{children}</>;
}
