import { Outlet } from "react-router-dom";
import { CurrentOrgProvider } from "@/features/orgs/context/current-org-context";
import { AppSidebar } from "./AppSidebar";

export function AppShellLayout() {
  return (
    <CurrentOrgProvider>
      <div className="flex min-h-svh">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </CurrentOrgProvider>
  );
}
