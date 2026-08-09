import { useState, type MouseEvent } from "react";
import { CheckIcon, Trash2Icon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LabelTag } from "@/components/domain/LabelTag";
import { useCreateLabel, useDeleteLabel, useLabels } from "@/features/labels/hooks/useLabels";
import type { Label } from "@/features/labels/types";
import { fieldTriggerClassName } from "../metadata/fieldStyles";

const LABEL_COLOR_PALETTE = [
  "#e06c75",
  "#e5a663",
  "#e0c463",
  "#7fb87f",
  "#61afef",
  "#9184d9",
  "#c678dd",
  "#8a8f98",
];

function CreateLabelForm({
  projectId,
  existingCount,
  onCreated,
}: {
  projectId: string;
  existingCount: number;
  onCreated: (labelId: string) => void;
}) {
  const [name, setName] = useState("");
  const createLabel = useCreateLabel(projectId);

  function submit() {
    const trimmed = name.trim();
    if (!trimmed || createLabel.isPending) return;
    const color = LABEL_COLOR_PALETTE[existingCount % LABEL_COLOR_PALETTE.length];
    createLabel.mutate(
      { name: trimmed, color },
      {
        onSuccess: (label) => {
          onCreated(label.id);
          setName("");
        },
      },
    );
  }

  return (
    <div className="flex items-center gap-1.5 px-1.5 py-1">
      <input
        type="text"
        value={name}
        onChange={(event) => setName(event.target.value)}
        onKeyDown={(event) => {
          event.stopPropagation();
          if (event.key === "Enter") {
            event.preventDefault();
            submit();
          }
        }}
        placeholder="New label name…"
        className="h-6 flex-1 rounded-md border border-input bg-background px-2 text-sm outline-none focus:ring-1 focus:ring-ring"
        aria-label="New label name"
      />
      <button
        type="button"
        onClick={submit}
        disabled={!name.trim() || createLabel.isPending}
        className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-[var(--color-accent-2)] outline-none hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
      >
        Add
      </button>
    </div>
  );
}

function LabelListItem({
  label,
  checked,
  onAdd,
  projectId,
}: {
  label: Label;
  checked: boolean;
  onAdd: () => void;
  projectId: string;
}) {
  const deleteLabel = useDeleteLabel(projectId);

  function handleDelete(event: MouseEvent) {
    event.stopPropagation();
    if (!window.confirm(`Delete the "${label.name}" label? This can't be undone.`)) return;
    deleteLabel.mutate(label.id);
  }

  return (
    <div className="group/label-item relative">
      <DropdownMenuItem
        onClick={checked ? undefined : onAdd}
        disabled={checked}
        closeOnClick={false}
        className="pr-14"
      >
        {label.name}
        {checked && <CheckIcon className="ml-auto size-3.5 text-[var(--color-neutral-500)]" />}
      </DropdownMenuItem>
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleteLabel.isPending}
        aria-label={`Delete ${label.name} label`}
        className="absolute right-7 top-1/2 hidden -translate-y-1/2 rounded-sm p-0.5 text-[var(--color-neutral-500)] outline-none hover:text-destructive disabled:cursor-not-allowed disabled:opacity-50 group-hover/label-item:inline-flex"
      >
        <Trash2Icon className="size-3.5" />
      </button>
    </div>
  );
}

export function NewTicketLabelsPicker({
  projectId,
  value,
  onChange,
}: {
  projectId: string;
  value: string[];
  onChange: (labelIds: string[]) => void;
}) {
  const { data: labels } = useLabels(projectId);
  const selectedIds = new Set(value);
  const selectedLabels = labels?.filter((label) => selectedIds.has(label.id)) ?? [];

  function toggle(labelId: string, checked: boolean) {
    const next = checked ? [...selectedIds, labelId] : [...selectedIds].filter((id) => id !== labelId);
    onChange(next);
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {selectedLabels.map((label) => (
        <LabelTag key={label.id} label={label} onRemove={() => toggle(label.id, false)} />
      ))}
      <DropdownMenu>
        <DropdownMenuTrigger className={fieldTriggerClassName(true, "border-dashed text-[var(--color-neutral-500)]")}>
          Labels
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-80">
          {labels?.map((label) => (
            <LabelListItem
              key={label.id}
              label={label}
              checked={selectedIds.has(label.id)}
              onAdd={() => toggle(label.id, true)}
              projectId={projectId}
            />
          ))}
          {labels?.length === 0 && (
            <div className="px-1.5 py-1 text-xs text-[var(--color-neutral-500)]">No labels in this project</div>
          )}
          <DropdownMenuSeparator />
          <CreateLabelForm
            projectId={projectId}
            existingCount={labels?.length ?? 0}
            onCreated={(labelId) => toggle(labelId, true)}
          />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
