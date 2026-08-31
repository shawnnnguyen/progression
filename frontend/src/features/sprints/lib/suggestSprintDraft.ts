import type { Sprint } from "../types";

const DEFAULT_LENGTH_DAYS = 14;

export interface SprintDraftDefaults {
  name: string;
  suggestedFromName: string | null;
  startDate: string;
  endDate: string;
}

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Recovers the "yyyy-mm-dd" a sprint's ISO date represents, using UTC getters since
 * the backend stores sprint dates at UTC midnight — local getters would roll the day
 * back for any timezone west of UTC. */
function toDateInputValueFromISO(iso: string): string {
  const date = new Date(iso);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Adds days to a "yyyy-mm-dd" value using local-time arithmetic, so DST/timezone shifts never move the calendar day. */
export function addDays(value: string, days: number): string {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + days);
  return toDateInputValue(date);
}

function latestSprint(sprints: Sprint[]): Sprint | null {
  return sprints.reduce<Sprint | null>(
    (latest, sprint) => (!latest || new Date(sprint.endDate) > new Date(latest.endDate) ? sprint : latest),
    null,
  );
}

/**
 * Suggests a name (incrementing the trailing number in the latest sprint's name, e.g.
 * "Sprint 24" -> "Sprint 25") and default dates (the day after the latest sprint ends,
 * running for the default length). Falls back to an empty name and today's date when
 * there's no prior sprint or its name has no trailing number to increment.
 */
export function suggestSprintDraft(sprints: Sprint[]): SprintDraftDefaults {
  const latest = latestSprint(sprints);
  const numberMatch = latest?.name.match(/(\d+)\s*$/);

  const startDate = latest ? addDays(toDateInputValueFromISO(latest.endDate), 1) : toDateInputValue(new Date());

  return {
    name: numberMatch ? latest!.name.replace(/\d+\s*$/, String(Number(numberMatch[1]) + 1)) : "",
    suggestedFromName: numberMatch ? latest!.name : null,
    startDate,
    endDate: addDays(startDate, DEFAULT_LENGTH_DAYS),
  };
}
