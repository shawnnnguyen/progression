import { LayoutDashboard } from "lucide-react";
import { OrgSwitcher } from "@/features/orgs/components/OrgSwitcher";
import { SidebarNavItem } from "./SidebarNavItem";
import { ProjectNavList } from "./ProjectNavList";
import { CurrentUserRow } from "./CurrentUserRow";

export function AppSidebar() {
  return (
    <aside className="flex w-64 shrink-0 flex-col gap-4 border-r border-sidebar-border bg-sidebar p-3 text-sidebar-foreground">
      <OrgSwitcher />
      <nav className="flex flex-col gap-0.5">
        <SidebarNavItem to="/dashboard" icon={LayoutDashboard} label="My Issues" />
      </nav>
      <div className="flex flex-1 flex-col gap-1 overflow-y-auto">
        <span className="px-2 text-xs font-medium text-muted-foreground">Projects</span>
        <ProjectNavList />
      </div>
      <CurrentUserRow />
    </aside>
  );
}
