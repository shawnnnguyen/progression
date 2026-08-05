import { useParams } from "react-router-dom";
import { ProjectBoardPage } from "@/features/board/components/ProjectBoardPage";

export default function ProjectBoardRoute() {
  const { projectId } = useParams<{ projectId: string }>();
  if (!projectId) return null;
  return <ProjectBoardPage projectId={projectId} />;
}
