import { ChevronsUpDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useOrgs } from "../hooks/useOrgs";
import { useCurrentOrg } from "../hooks/useCurrentOrg";

export function OrgSwitcher() {
  const { data: orgs } = useOrgs();
  const { currentOrgId, setCurrentOrgId } = useCurrentOrg();

  const currentOrg = orgs?.find((org) => org.id === currentOrgId);

  if (!orgs || orgs.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
        <span className="truncate">{currentOrg?.name ?? "Select organization"}</span>
        <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {orgs.map((org) => (
          <DropdownMenuItem key={org.id} onClick={() => setCurrentOrgId(org.id)}>
            {org.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
