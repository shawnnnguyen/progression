import { useParams } from "react-router-dom";
import { TicketDetailPage } from "@/features/tickets/components/TicketDetailPage";

export default function TicketDetailRoute() {
  const { projectId, ticketNumber } = useParams<{ projectId: string; ticketNumber: string }>();
  const number = ticketNumber ? Number(ticketNumber) : NaN;
  if (!projectId || Number.isNaN(number)) return null;
  return <TicketDetailPage projectId={projectId} ticketNumber={number} />;
}
