import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTicket } from "../hooks/useTicket";
import { TicketDetailContent } from "./TicketDetailContent";
import { TicketDetailMetaStrip } from "./TicketDetailMetaStrip";

export function TicketDetailSheet({
  projectId,
  projectKey,
  ticketNumber,
  onClose,
}: {
  projectId: string;
  projectKey: string;
  ticketNumber: number;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const ticketQuery = useTicket(projectId, ticketNumber);

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="text-[var(--color-neutral-400)]">
            {projectKey}-{ticketNumber}
          </SheetTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/projects/${projectId}/tickets/${ticketNumber}`)}
            >
              Open full page
            </Button>
            <kbd className="flex h-7 items-center rounded-[min(var(--radius-md),12px)] border border-border bg-background px-2 text-[0.8rem] font-sans text-muted-foreground">
              Esc
            </kbd>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4">
          {ticketQuery.isLoading && (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          )}

          {ticketQuery.isError && <p className="text-sm text-muted-foreground">Something went wrong loading this ticket.</p>}

          {ticketQuery.data && (
            <TicketDetailContent
              ticket={ticketQuery.data}
              projectId={projectId}
              projectKey={projectKey}
              showTabs={false}
              showByline={false}
              metaSlot={<TicketDetailMetaStrip ticket={ticketQuery.data} projectId={projectId} />}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
