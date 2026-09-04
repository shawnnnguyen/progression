import { Dialog, DialogContent } from "@/components/ui/dialog";
import { InviteTeammatesStep } from "./onboarding/InviteTeammatesStep";

export function InviteTeammatesDialog({
  orgId,
  open,
  onOpenChange,
}: {
  orgId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 p-0">
        <div className="border-b border-[var(--color-divider)] px-4 py-3">
          <span className="text-sm font-medium text-[var(--color-text)]">Invite teammates</span>
        </div>
        <div className="p-4">
          {/* Keyed on open so reopening after a close/send always starts with a
           * blank draft row instead of the base-ui dialog's still-mounted content. */}
          <InviteTeammatesStep key={String(open)} orgId={orgId} onComplete={() => onOpenChange(false)} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
