import type { StateCategory } from "../types";

export const stateCategoryStyles: Record<StateCategory, { dotClassName: string; label: string }> = {
  BACKLOG: { dotClassName: "bg-[var(--color-neutral-600)]", label: "Backlog" },
  TODO: { dotClassName: "bg-[var(--color-neutral-400)]", label: "Todo" },
  INPROGRESS: { dotClassName: "bg-[var(--color-accent-400)]", label: "In Progress" },
  DONE: { dotClassName: "bg-[var(--color-accent-200)]", label: "Done" },
  CANCELED: { dotClassName: "bg-[var(--color-neutral-700)]", label: "Canceled" },
};
