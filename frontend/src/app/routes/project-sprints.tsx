import { useParams } from "react-router-dom";
import { SprintsPage } from "@/features/sprints/components/SprintsPage";

export default function ProjectSprintsRoute() {
  const { projectId } = useParams<{ projectId: string }>();
  if (!projectId) return null;
  return <SprintsPage projectId={projectId} />;
}
