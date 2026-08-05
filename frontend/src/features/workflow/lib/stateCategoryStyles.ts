import type { StateCategory } from "../types";

export const stateCategoryStyles: Record<StateCategory, { dotClassName: string; label: string }> = {
  BACKLOG: { dotClassName: "bg-muted-foreground/50", label: "Backlog" },
  TODO: { dotClassName: "bg-sky-400", label: "Todo" },
  INPROGRESS: { dotClassName: "bg-amber-400", label: "In Progress" },
  DONE: { dotClassName: "bg-emerald-400", label: "Done" },
  CANCELED: { dotClassName: "bg-destructive", label: "Canceled" },
};
