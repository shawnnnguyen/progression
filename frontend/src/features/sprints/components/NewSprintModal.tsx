import { useEffect, useState, type FormEvent } from "react";
import { ChevronDownIcon } from "lucide-react";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ProjectKeyBadge } from "@/features/projects/components/ProjectKeyBadge";
import { fieldInputClassName, fieldTriggerClassName, FIELD_LABEL_CLASSNAME } from "@/features/tickets/components/metadata/fieldStyles";
import { formatDateOnly } from "@/features/tickets/lib/formatTimestamp";
import type { ProjectRow } from "@/features/projects/types";
import { useSprints } from "../hooks/useSprints";
import { useActiveSprint } from "../hooks/useActiveSprint";
import { useCreateSprint } from "../hooks/useCreateSprint";
import { addDays, suggestSprintDraft, type SprintDraftDefaults } from "../lib/suggestSprintDraft";

const EMPTY_DEFAULTS: SprintDraftDefaults = { name: "", suggestedFromName: null, startDate: "", endDate: "" };

const LENGTH_OPTIONS: { days: number; label: string }[] = [
  { days: 7, label: "1 week" },
  { days: 14, label: "2 weeks" },
  { days: 21, label: "3 weeks" },
  { days: 28, label: "4 weeks" },
];

interface Draft {
  name: string;
  startDate: string;
  endDate: string;
  lengthDays: number;
  goal: string;
  startNow: boolean;
}

function draftFromDefaults(defaults: SprintDraftDefaults): Draft {
  return {
    name: defaults.name,
    startDate: defaults.startDate,
    endDate: defaults.endDate,
    lengthDays: 14,
    goal: "",
    startNow: false,
  };
}

function SprintLengthField({ days, onChange }: { days: number; onChange: (days: number) => void }) {
  const label = LENGTH_OPTIONS.find((option) => option.days === days)?.label ?? `${days} days`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={fieldTriggerClassName(false)}>
        <span className="min-w-0 truncate">{label}</span>
        <ChevronDownIcon className="ml-auto size-3.5 shrink-0 text-[var(--color-neutral-500)]" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuRadioGroup value={String(days)} onValueChange={(next) => onChange(Number(next))}>
          {LENGTH_OPTIONS.map((option) => (
            <DropdownMenuRadioItem key={option.days} value={String(option.days)}>
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function NewSprintModal({ project }: { project: ProjectRow }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(() => draftFromDefaults(EMPTY_DEFAULTS));
  const [defaults, setDefaults] = useState<SprintDraftDefaults>(EMPTY_DEFAULTS);
  const [defaultsApplied, setDefaultsApplied] = useState(false);

  const sprintsQuery = useSprints(project.id);
  const { activeSprint } = useActiveSprint(project.id);
  const createSprint = useCreateSprint(project.id);

  useEffect(() => {
    if (!defaultsApplied && sprintsQuery.data) {
      const next = suggestSprintDraft(sprintsQuery.data);
      setDefaults(next);
      setDraft(draftFromDefaults(next));
      setDefaultsApplied(true);
    }
  }, [defaultsApplied, sprintsQuery.data]);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setDraft(draftFromDefaults(EMPTY_DEFAULTS));
      setDefaults(EMPTY_DEFAULTS);
      setDefaultsApplied(false);
    }
  }

  function handleStartDateChange(value: string) {
    setDraft((d) => ({ ...d, startDate: value, endDate: addDays(value, d.lengthDays) }));
  }

  function handleLengthChange(days: number) {
    setDraft((d) => ({ ...d, lengthDays: days, endDate: addDays(d.startDate, days) }));
  }

  const isValid =
    draft.name.trim() !== "" && draft.startDate !== "" && draft.endDate !== "" && draft.endDate > draft.startDate;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!isValid || createSprint.isPending) return;

    createSprint.mutate(
      {
        name: draft.name.trim(),
        goal: draft.goal.trim() || undefined,
        startDate: new Date(draft.startDate).toISOString(),
        endDate: new Date(draft.endDate).toISOString(),
        activateImmediately: draft.startNow,
      },
      { onSuccess: () => handleOpenChange(false) },
    );
  }

  const showActiveSprintNotice = draft.startNow && activeSprint;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="default" size="lg" />}>New sprint</DialogTrigger>
      <DialogContent className="max-w-lg gap-0 border border-[var(--color-neutral-400)] p-0">
        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="flex items-center gap-2 border-b border-[var(--color-divider)] px-4 py-3">
            <ProjectKeyBadge projectKey={project.key} />
            <span className="text-sm font-medium text-[var(--color-text)]">New sprint</span>
          </div>

          <div className="flex flex-col gap-4 p-4">
            <div className="flex flex-col gap-1.5">
              <label className={FIELD_LABEL_CLASSNAME}>Name</label>
              <input
                type="text"
                autoFocus
                value={draft.name}
                onChange={(event) => setDraft((d) => ({ ...d, name: event.target.value }))}
                placeholder="Sprint name"
                maxLength={200}
                className={fieldInputClassName()}
              />
              {defaults.suggestedFromName && (
                <p className="text-xs text-[var(--color-neutral-500)]">
                  Suggested from the last sprint in {project.name}.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className={FIELD_LABEL_CLASSNAME}>Starts</label>
                  <input
                    type="date"
                    value={draft.startDate}
                    onChange={(event) => handleStartDateChange(event.target.value)}
                    className={fieldInputClassName()}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={FIELD_LABEL_CLASSNAME}>Ends</label>
                  <input
                    type="date"
                    value={draft.endDate}
                    min={draft.startDate}
                    onChange={(event) => setDraft((d) => ({ ...d, endDate: event.target.value }))}
                    className={fieldInputClassName()}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={FIELD_LABEL_CLASSNAME}>Length</label>
                  <SprintLengthField days={draft.lengthDays} onChange={handleLengthChange} />
                </div>
              </div>
              {defaults.suggestedFromName && (
                <p className="text-xs text-[var(--color-neutral-500)]">
                  Starts the day after {defaults.suggestedFromName} ends. Changing the length moves the end date.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={FIELD_LABEL_CLASSNAME}>
                Goal <span className="text-[var(--color-neutral-400)]">optional</span>
              </label>
              <textarea
                value={draft.goal}
                onChange={(event) => setDraft((d) => ({ ...d, goal: event.target.value }))}
                placeholder="One sentence the team can hold itself to."
                rows={2}
                className={fieldInputClassName("resize-y")}
              />
              <p className="text-xs text-[var(--color-neutral-500)]">
                One sentence the team can hold itself to. Shown on the sprint card and the dashboard.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={FIELD_LABEL_CLASSNAME}>Status on create</label>
              <div className="inline-flex w-fit divide-x divide-border overflow-hidden rounded-md border border-border">
                <button
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, startNow: false }))}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium leading-none",
                    !draft.startNow ? "text-primary ring-1 ring-inset ring-primary" : "hover:bg-muted/50",
                  )}
                >
                  Planned
                </button>
                <button
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, startNow: true }))}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium leading-none",
                    draft.startNow ? "text-primary ring-1 ring-inset ring-primary" : "hover:bg-muted/50",
                  )}
                >
                  Start now
                </button>
              </div>
              {showActiveSprintNotice && activeSprint && (
                <p className="text-xs text-[var(--color-neutral-500)]">
                  {activeSprint.name} is still active until {formatDateOnly(activeSprint.endDate)} — starting this
                  one now will run two sprints in parallel.
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-[var(--color-divider)] px-4 py-3">
            <p className="text-xs text-[var(--color-neutral-500)]">Sprints are per-project and can be renamed later.</p>
            <div className="flex items-center gap-2">
              <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
              <Button type="submit" disabled={!isValid || createSprint.isPending}>
                Create sprint
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
