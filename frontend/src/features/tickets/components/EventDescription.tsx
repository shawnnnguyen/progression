import type { ReactNode } from "react";
import { LabelTag } from "@/components/domain/LabelTag";
import type { EffectiveProjectMember } from "@/features/projects/types";
import type { WorkflowState } from "@/features/workflow/types";
import type { Sprint } from "@/features/sprints/types";
import type { Label } from "@/features/labels/types";
import type { Priority, TicketEventRow } from "../types";

const PRIORITY_LABEL: Record<Priority, string> = {
  NONE: "None",
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

export interface EventDescriptionContext {
  memberMap: Map<string, EffectiveProjectMember>;
  stateMap: Map<string, WorkflowState>;
  sprintMap: Map<string, Sprint>;
  labelMap: Map<string, Label>;
}

function memberName(userId: unknown, ctx: EventDescriptionContext): string {
  if (typeof userId !== "string") return "Unassigned";
  return ctx.memberMap.get(userId)?.name ?? "a former member";
}

function stateName(stateId: unknown, ctx: EventDescriptionContext): string {
  if (typeof stateId !== "string") return "an unknown state";
  return ctx.stateMap.get(stateId)?.name ?? "an unknown state";
}

function sprintName(sprintId: unknown, ctx: EventDescriptionContext): string {
  if (typeof sprintId !== "string") return "no sprint";
  return ctx.sprintMap.get(sprintId)?.name ?? "an unknown sprint";
}

function LabelChips({ labelIds, ctx }: { labelIds: unknown; ctx: EventDescriptionContext }) {
  const ids = Array.isArray(labelIds) ? (labelIds as string[]) : [];
  return (
    <>
      {ids.map((id) => {
        const label = ctx.labelMap.get(id);
        return label ? <LabelTag key={id} label={label} /> : <Strong key={id}>a label</Strong>;
      })}
    </>
  );
}

function Muted({ children }: { children: ReactNode }) {
  return <span className="text-[var(--color-neutral-500)]">{children}</span>;
}

function Strong({ children }: { children: ReactNode }) {
  return <span className="font-medium text-[var(--color-text)]">{children}</span>;
}

function Struck({ children }: { children: ReactNode }) {
  return <span className="text-[var(--color-neutral-500)] line-through">{children}</span>;
}

/** Renders the part of an activity line after the actor's name — "changed priority from **Medium** to **High**", etc. */
export function EventDescription({ event, ctx }: { event: TicketEventRow; ctx: EventDescriptionContext }) {
  const data = event.data;

  switch (event.type) {
    case "CREATED":
      return <Muted>created this ticket</Muted>;
    case "TITLE_CHANGED":
      return (
        <>
          <Muted>changed the title from</Muted> <Struck>{String(data.before)}</Struck> <Muted>to</Muted>{" "}
          <Strong>{String(data.after)}</Strong>
        </>
      );
    case "DESCRIPTION_CHANGED":
      return <Muted>updated the description</Muted>;
    case "STATE_CHANGED":
      return (
        <>
          <Muted>moved this from</Muted> <Strong>{stateName(data.fromStateId, ctx)}</Strong> <Muted>to</Muted>{" "}
          <Strong>{stateName(data.toStateId, ctx)}</Strong>
        </>
      );
    case "PRIORITY_CHANGED":
      return (
        <>
          <Muted>changed priority from</Muted>{" "}
          <Strong>{PRIORITY_LABEL[data.before as Priority] ?? String(data.before)}</Strong> <Muted>to</Muted>{" "}
          <Strong>{PRIORITY_LABEL[data.after as Priority] ?? String(data.after)}</Strong>
        </>
      );
    case "ASSIGNED":
      return (
        <>
          <Muted>assigned</Muted> <Strong>{memberName(data.assigneeId, ctx)}</Strong>
        </>
      );
    case "UNASSIGNED":
      return (
        <>
          <Muted>unassigned</Muted> <Strong>{memberName(data.previousAssigneeId, ctx)}</Strong>
        </>
      );
    case "LABEL_ADDED":
      return (
        <>
          <Muted>added label</Muted> <LabelChips labelIds={data.labelIds} ctx={ctx} />
        </>
      );
    case "LABEL_REMOVED":
      return (
        <>
          <Muted>removed label</Muted> <LabelChips labelIds={data.labelIds} ctx={ctx} />
        </>
      );
    case "SPRINT_CHANGED":
      return data.after ? (
        <>
          <Muted>moved this to</Muted> <Strong>{sprintName(data.after, ctx)}</Strong>
        </>
      ) : (
        <>
          <Muted>removed this from</Muted> <Strong>{sprintName(data.before, ctx)}</Strong>
        </>
      );
    default:
      return <Muted>updated this ticket</Muted>;
  }
}
