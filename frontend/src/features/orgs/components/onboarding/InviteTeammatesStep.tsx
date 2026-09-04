import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useSendInvites } from "../../hooks/useSendInvites";
import { useInvites } from "../../hooks/useInvites";
import { useRevokeInvite } from "../../hooks/useRevokeInvite";
import { formatInviteExpiry } from "../../lib/formatInviteExpiry";
import type { OrgRole } from "../../types";
import { RoleSelect } from "./RoleSelect";

interface DraftRow {
  id: number;
  email: string;
  role: OrgRole;
}

let nextRowId = 1;
function emptyRow(): DraftRow {
  return { id: nextRowId++, email: "", role: "MEMBER" };
}

export function InviteTeammatesStep({
  orgId,
  onComplete,
}: {
  orgId: string;
  onComplete: () => void;
}) {
  const [rows, setRows] = useState<DraftRow[]>([emptyRow()]);
  const sendInvites = useSendInvites(orgId);
  const revokeInvite = useRevokeInvite(orgId);
  const invitesQuery = useInvites(orgId);

  const pendingInvites = (invitesQuery.data ?? []).filter(
    (invite) => !invite.acceptedAt && !invite.revokedAt && new Date(invite.expiresAt) > new Date(),
  );

  const filledRows = rows.filter((row) => row.email.trim());

  function updateRow(id: number, patch: Partial<DraftRow>) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  function handleSend() {
    if (filledRows.length === 0) return;
    sendInvites.mutate(
      filledRows.map((row) => ({ email: row.email.trim(), role: row.role })),
      { onSuccess: onComplete },
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="flex flex-col gap-2">
        {rows.map((row) => (
          <div key={row.id} className="flex gap-2">
            <Input
              type="email"
              placeholder="name@example.com"
              value={row.email}
              onChange={(event) => updateRow(row.id, { email: event.target.value })}
              className="flex-1"
            />
            <RoleSelect role={row.role} onChange={(role) => updateRow(row.id, { role })} />
          </div>
        ))}

        <Button
          type="button"
          variant="link"
          className="w-fit px-0"
          onClick={() => setRows((current) => [...current, emptyRow()])}
        >
          <Plus className="size-3.5" data-icon="inline-start" />
          Add another
        </Button>
      </div>

      {pendingInvites.length > 0 && (
        <div className="mt-6 border-t border-border pt-4">
          <span className="text-xs tracking-wide text-muted-foreground">
            Pending invites · {pendingInvites.length}
          </span>
          <ul className="mt-2 flex flex-col gap-2">
            {pendingInvites.map((invite) => (
              <li key={invite.id} className="flex items-center gap-2 text-sm">
                <span className="min-w-0 flex-1 truncate text-foreground">{invite.email}</span>
                <Badge variant="outline">{invite.role}</Badge>
                <span className="shrink-0 text-xs text-muted-foreground">{formatInviteExpiry(invite.expiresAt)}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={revokeInvite.isPending}
                  onClick={() => revokeInvite.mutate(invite.id)}
                >
                  Revoke
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onComplete}>
          Close
        </Button>
        <Button type="button" onClick={handleSend} disabled={filledRows.length === 0 || sendInvites.isPending}>
          {sendInvites.isPending
            ? "Sending…"
            : `Send ${filledRows.length || ""} invite${filledRows.length === 1 ? "" : "s"}`}
        </Button>
      </div>
    </div>
  );
}
