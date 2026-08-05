export interface RecentActivityPanelProps {
  events?: unknown[];
}

// No cross-project ticket-activity feed exists yet (backend gap) — ships as a
// static empty-state, typed to accept an `events` prop once one does.
export function RecentActivityPanel(_props: RecentActivityPanelProps) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Recent activity</h2>
      <div className="rounded-md border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
        Activity feed coming soon
      </div>
    </section>
  );
}
