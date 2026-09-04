import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CreateProjectStep } from "./onboarding/CreateProjectStep";

export function CreateProjectDialog({
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
      <DialogContent className="max-w-sm gap-0 p-0">
        <div className="border-b border-[var(--color-divider)] px-4 py-3">
          <span className="text-sm font-medium text-[var(--color-text)]">New project</span>
        </div>
        <div className="p-4">
          {/* Keyed on open so reopening after a close always starts with a blank
           * form instead of the base-ui dialog's still-mounted content. */}
          <CreateProjectStep key={String(open)} orgId={orgId} onCreated={() => onOpenChange(false)} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
