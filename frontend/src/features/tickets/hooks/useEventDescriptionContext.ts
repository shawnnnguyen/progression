import { useProjectMemberMap } from "@/features/projects/hooks/useProjectMembers";
import { useWorkflowStates } from "@/features/workflow/hooks/useWorkflowStates";
import { useSprints } from "@/features/sprints/hooks/useSprints";
import { useLabels } from "@/features/labels/hooks/useLabels";
import type { EventDescriptionContext } from "../components/EventDescription";

export function useEventDescriptionContext(projectId: string): EventDescriptionContext {
  const { memberMap } = useProjectMemberMap(projectId);
  const { data: states } = useWorkflowStates(projectId);
  const { data: sprints } = useSprints(projectId);
  const { data: labels } = useLabels(projectId);

  const stateMap = new Map((states ?? []).map((state) => [state.id, state]));
  const sprintMap = new Map((sprints ?? []).map((sprint) => [sprint.id, sprint]));
  const labelMap = new Map((labels ?? []).map((label) => [label.id, label]));

  return { memberMap, stateMap, sprintMap, labelMap };
}
