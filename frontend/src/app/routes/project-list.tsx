import { useParams } from "react-router-dom";
import { ProjectListPage } from "@/features/list/components/ProjectListPage";

export default function ProjectListRoute() {
  const { projectId } = useParams<{ projectId: string }>();
  if (!projectId) return null;
  return <ProjectListPage projectId={projectId} />;
}
