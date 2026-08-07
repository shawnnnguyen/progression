import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useProject } from "@/features/projects/hooks/useProject";
import { useTicket } from "../hooks/useTicket";
import { TicketDetailContent } from "./TicketDetailContent";
import { TicketDetailRail } from "./TicketDetailRail";
import { TicketDetailTopbar } from "./TicketDetailTopbar";

export function TicketDetailPage({ projectId, ticketNumber }: { projectId: string; ticketNumber: number }) {
  const projectQuery = useProject(projectId);
  const ticketQuery = useTicket(projectId, ticketNumber);

  if (projectQuery.isLoading || ticketQuery.isLoading) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex h-14 shrink-0 items-center border-b border-[var(--color-divider)] px-5">
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="flex flex-1 gap-6 p-6">
          <div className="flex flex-1 flex-col gap-3">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
          <Skeleton className="h-96 w-70 shrink-0" />
        </div>
      </div>
    );
  }

  if (projectQuery.isError || ticketQuery.isError) {
    return (
      <div className="flex flex-col items-center gap-3 p-10 text-center text-muted-foreground">
        <p>Something went wrong loading this ticket.</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            projectQuery.refetch();
            ticketQuery.refetch();
          }}
        >
          Try again
        </Button>
      </div>
    );
  }

  if (!projectQuery.data || !ticketQuery.data) return null;

  return (
    <div className="flex h-full flex-col">
      <TicketDetailTopbar project={projectQuery.data} ticket={ticketQuery.data} />
      <div className="flex flex-1 overflow-y-auto">
        <div className="flex-1 p-6">
          <TicketDetailContent
            ticket={ticketQuery.data}
            projectId={projectId}
            projectKey={projectQuery.data.key}
            showActivityFeed={false}
            showCommentFeed
          />
        </div>
        <TicketDetailRail ticket={ticketQuery.data} projectId={projectId} />
      </div>
    </div>
  );
}
