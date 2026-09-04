import { useState } from "react";
import { PageTopbar } from "@/components/layout/PageTopbar";
import { Button } from "@/components/ui/button";
import { useCurrentOrg } from "@/features/orgs/hooks/useCurrentOrg";
import { useOrgs } from "@/features/orgs/hooks/useOrgs";
import { useOrgMembers } from "@/features/orgs/hooks/useOrgMembers";
import { InviteTeammatesDialog } from "@/features/orgs/components/InviteTeammatesDialog";
import { CreateProjectDialog } from "./CreateProjectDialog";

export function EmptyProjectsScreen() {
  const { currentOrgId } = useCurrentOrg();
  const { data: orgs } = useOrgs();
  const { data: members } = useOrgMembers(currentOrgId);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  if (!currentOrgId) return null;

  const currentOrg = orgs?.find((org) => org.id === currentOrgId);
  const memberCount = members?.length ?? 0;

  return (
    <div className="flex h-full flex-col">
      <PageTopbar
        left={
          <>
            <h1 className="font-heading text-sm font-semibold">{currentOrg?.name}</h1>
            <span className="text-xs text-muted-foreground">
              {memberCount} member{memberCount === 1 ? "" : "s"}
            </span>
          </>
        }
      />

      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-semibold text-foreground">Create your first project</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            A project owns its own key, workflow states, labels and sprints. Most teams start with
            one per surface they ship.
          </p>

          <div className="mt-6 flex gap-2">
            <Button type="button" onClick={() => setIsCreateOpen(true)}>
              Create project
            </Button>
            <Button type="button" variant="outline" onClick={() => setIsInviteOpen(true)}>
              Invite teammates first
            </Button>
          </div>
        </div>
      </div>

      <CreateProjectDialog orgId={currentOrgId} open={isCreateOpen} onOpenChange={setIsCreateOpen} />
      <InviteTeammatesDialog orgId={currentOrgId} open={isInviteOpen} onOpenChange={setIsInviteOpen} />
    </div>
  );
}
