import { useState } from "react";
import { useLocation } from "react-router-dom";
import { IconChevronRight, IconLayoutKanban, IconLayoutDashboard, IconRocket } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { OrgSwitcher } from "@/features/orgs/components/OrgSwitcher";
import { SidebarNavItem } from "./SidebarNavItem";
import { ProjectNavList } from "./ProjectNavList";
import { SprintNavList } from "./SprintNavList";
import { CurrentUserRow } from "./CurrentUserRow";

export function AppSidebar() {
  const location = useLocation();
  const [isProjectsOpen, setIsProjectsOpen] = useState(() => location.pathname.startsWith("/projects/"));
  const [isSprintsOpen, setIsSprintsOpen] = useState(true);

  return (
    <aside className="flex w-64 shrink-0 flex-col gap-4 border-r border-sidebar-border bg-sidebar p-3 text-sidebar-foreground">
      <OrgSwitcher />
      <nav className="flex flex-col gap-0.5">
        <SidebarNavItem to="/dashboard" icon={IconLayoutDashboard} label="My Issues" />
      </nav>
      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={() => setIsSprintsOpen((open) => !open)}
          aria-expanded={isSprintsOpen}
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <IconRocket className="size-4 shrink-0" />
          Sprints
          <IconChevronRight
            className={cn("ml-auto size-3 shrink-0 transition-transform", isSprintsOpen && "rotate-90")}
          />
        </button>
        {isSprintsOpen && <SprintNavList />}
      </div>
      <div className="flex flex-1 flex-col gap-1 overflow-y-auto">
        <button
          type="button"
          onClick={() => setIsProjectsOpen((open) => !open)}
          aria-expanded={isProjectsOpen}
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <IconLayoutKanban className="size-4 shrink-0" />
          Projects
          <IconChevronRight
            className={cn("ml-auto size-3 shrink-0 transition-transform", isProjectsOpen && "rotate-90")}
          />
        </button>
        {isProjectsOpen && <ProjectNavList />}
      </div>
      <CurrentUserRow />
    </aside>
  );
}
