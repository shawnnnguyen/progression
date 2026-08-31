import { useEffect, useState, type FormEvent, type ReactElement, type ReactNode } from "react";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useWorkflowStates } from "@/features/workflow/hooks/useWorkflowStates";
import { useSprints } from "@/features/sprints/hooks/useSprints";
import type { ProjectRow } from "@/features/projects/types";
import { useCreateTicket } from "../../hooks/useCreateTicket";
import type { Priority } from "../../types";
import { NewTicketProjectPicker } from "./NewTicketProjectPicker";
import { NewTicketStatePicker } from "./NewTicketStatePicker";
import { NewTicketPriorityPicker } from "./NewTicketPriorityPicker";
import { NewTicketAssigneePicker } from "./NewTicketAssigneePicker";
import { NewTicketLabelsPicker } from "./NewTicketLabelsPicker";
import { NewTicketSprintPicker } from "./NewTicketSprintPicker";

interface Draft {
  project: ProjectRow;
  title: string;
  description: string;
  stateId: string | undefined;
  priority: Priority;
  assigneeId: string | null;
  labelIds: string[];
  sprintId: string | null;
}

function emptyDraft(project: ProjectRow, initialStateId?: string): Draft {
  return {
    project,
    title: "",
    description: "",
    stateId: initialStateId,
    priority: "NONE",
    assigneeId: null,
    labelIds: [],
    sprintId: null,
  };
}

export function NewTicketModal({
  project,
  initialStateId,
  triggerRender,
  triggerChildren,
}: {
  project: ProjectRow;
  initialStateId?: string;
  triggerRender?: ReactElement;
  triggerChildren?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(project, initialStateId));

  const statesQuery = useWorkflowStates(draft.project.id);
  const sprintsQuery = useSprints(draft.project.id);
  const createTicket = useCreateTicket();

  useEffect(() => {
    if (draft.stateId === undefined && statesQuery.data) {
      const defaultState = statesQuery.data.find((s) => s.isDefault);
      if (defaultState) setDraft((d) => (d.stateId === undefined ? { ...d, stateId: defaultState.id } : d));
    }
  }, [draft.stateId, statesQuery.data]);

  useEffect(() => {
    if (draft.sprintId === null && sprintsQuery.data) {
      const activeSprint = sprintsQuery.data.find((s) => s.status === "ACTIVE");
      if (activeSprint) setDraft((d) => (d.sprintId === null ? { ...d, sprintId: activeSprint.id } : d));
    }
  }, [draft.project.id, sprintsQuery.data]);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setDraft(emptyDraft(project, initialStateId));
    }
  }

  function handleProjectChange(nextProject: ProjectRow) {
    setDraft((d) => ({ ...emptyDraft(nextProject), title: d.title, description: d.description }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const title = draft.title.trim();
    if (!title || createTicket.isPending) return;

    createTicket.mutate(
      {
        projectId: draft.project.id,
        title,
        description: draft.description.trim() || undefined,
        priority: draft.priority,
        stateId: draft.stateId,
        assigneeId: draft.assigneeId,
        sprintId: draft.sprintId,
        labelIds: draft.labelIds,
      },
      {
        onSuccess: () => {
          handleOpenChange(false);
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={triggerRender ?? <Button variant="default" size="lg" className="ml-auto" />}>
        {triggerRender ? triggerChildren : "New ticket"}
      </DialogTrigger>
      <DialogContent className="max-w-xl gap-0 border border-[var(--color-neutral-400)] p-0">
        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="flex items-center gap-2 border-b border-[var(--color-divider)] px-4 py-3">
            <NewTicketProjectPicker orgId={project.orgId} value={draft.project} onChange={handleProjectChange} />
            <span className="text-sm text-[var(--color-neutral-500)]">New ticket</span>
          </div>

          <div className="flex flex-col gap-3 p-4">
            <input
              type="text"
              autoFocus
              value={draft.title}
              onChange={(event) => setDraft((d) => ({ ...d, title: event.target.value }))}
              placeholder="Ticket title"
              maxLength={500}
              className="w-full text-xl font-semibold text-[var(--color-text)] outline-none placeholder:text-[var(--color-neutral-500)]"
            />
            <textarea
              value={draft.description}
              onChange={(event) => setDraft((d) => ({ ...d, description: event.target.value }))}
              placeholder="Add description..."
              rows={4}
              className="w-full resize-y text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-neutral-500)]"
            />

            <div className="flex flex-wrap items-center gap-2">
              <NewTicketStatePicker
                projectId={draft.project.id}
                value={draft.stateId}
                onChange={(stateId) => setDraft((d) => ({ ...d, stateId }))}
              />
              <NewTicketPriorityPicker
                value={draft.priority}
                onChange={(priority) => setDraft((d) => ({ ...d, priority }))}
              />
              <NewTicketAssigneePicker
                projectId={draft.project.id}
                value={draft.assigneeId}
                onChange={(assigneeId) => setDraft((d) => ({ ...d, assigneeId }))}
              />
              <NewTicketLabelsPicker
                projectId={draft.project.id}
                value={draft.labelIds}
                onChange={(labelIds) => setDraft((d) => ({ ...d, labelIds }))}
              />
              <NewTicketSprintPicker
                projectId={draft.project.id}
                value={draft.sprintId}
                onChange={(sprintId) => setDraft((d) => ({ ...d, sprintId }))}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-[var(--color-divider)] px-4 py-3">
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button type="submit" disabled={!draft.title.trim() || createTicket.isPending}>
              Create ticket
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
