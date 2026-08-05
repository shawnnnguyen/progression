# Plan: Implement B1 (Dashboard/My Issues), B2 (Project Board), B3 (Project List)

## Context

The Claude Design project "Progress tracker UI flow" specs 20 screens for **progression** (a
ticket tracker) built on the Nocturne dark-theme design system. `core-service/` (Fastify +
Prisma) already implements the backend for this data model. `frontend/` is a Vite + React 19 +
TypeScript scaffold (bulletproof-react-style feature folders) that currently renders nothing but
a health-check placeholder — no router, no auth state, no ticket/project/board UI exists yet.

This plan covers the first 3 of the 20 screens — the "B · Daily use" section's core loop:
**B1 Dashboard/My Issues**, **B2 Project board (Kanban)**, **B3 Project list (table)** — plus the
shared chrome (`AppSidebar`) and domain primitives (`Avatar`, `PriorityIcon`) all three depend on.
Scope stops at the frontend: no `core-service` changes are planned here (see Decisions, #3).

Two research passes (`Explore` agents) confirmed the exact backend API contract and the exact
current state of the frontend scaffold, and a `Plan` agent used both to design the file-level
breakdown below. All three passes are reflected in this document; nothing here is guessed.

## Decisions made (not re-litigated below)

1. **Routing: React Router** (`react-router-dom`, data-router API). No router exists today.
2. **Board interaction: click-based "Move to…" menu**, not drag-and-drop, for v1. Sourced from
   `GET /projects/:id/workflow-transitions` so only legal moves are offered. Drag-and-drop is an
   explicit future fast-follow, not in scope now.
3. **Backend gaps: frontend-only workarounds, no `core-service` changes in this plan.** See
   "Confirmed backend gaps" below — each has a defined, non-fake fallback rather than inventing
   an endpoint that doesn't exist.
4. **State management for current-user/org selection: React Context**, not a new library —
   `zustand` isn't installed despite `features/*/stores/` folders existing in the scaffold, and
   this is a small amount of global state that doesn't justify adding a dependency.

## Confirmed backend gaps (verified by reading `core-service` directly, not assumed)

1. **No user-lookup endpoint for other users.** `GET /projects/:id/members` returns only
   `{userId, role, source}` — no name/avatar/email. `GET /orgs/:id/members` is equally bare. The
   only endpoint returning a user's name/avatar is `GET /me` (self only). **Consequence:**
   assignee avatars/names are only fully real on B1 (assignee is always "you", resolved via
   `/me`). On B2/B3, `UserAvatar` falls back to a deterministic id-derived glyph + tooltip instead
   of a fabricated name. **This is the single most important gap to flag back to whoever owns
   `core-service`** — a batch user-lookup or enriched members response would remove it entirely.
2. **No per-ticket label data.** `TicketRow` has no `labels` field, and no endpoint returns a
   given ticket's labels — labels are only usable as a single-value list filter
   (`GET /projects/:id/tickets?label=`). **Consequence:** no label chips on any ticket
   card/row/list-item in B1/B2/B3; the B3 table's "Labels" column renders an em-dash. Labels
   remain usable only in the B3 filter bar (via `GET /projects/:id/labels`).
3. **No cross-project *ticket-activity* feed.** Only `GET /tickets/:id/events` (per-ticket)
   exists. (`GET /orgs/:id/audit-events` is org-scoped but carries only admin/membership events —
   role changes, project creation — not ticket work activity, so it doesn't help here.)
   **Consequence:** B1's "Recent activity" panel ships as a static empty-state placeholder in
   v1 (typed to accept an `events` prop later), not faked or built via an N+1 fan-out.
4. **No ticket-count / progress-aggregate endpoint**, and `GET /orgs/:id/projects` returns a
   plain array with no counts. **Consequence:** B1's "Active projects" mini-cards and the open
   counts/progress bars are derived by paginating `GET /projects/:id/tickets` client-side, capped
   (see §Data fetching) — an approximation, flagged in-UI, not a true total.
5. **No server-side `priority` filter or `sort` param** on `GET /projects/:id/tickets` (only
   `state`/`assignee`/`label`/`sprint`/`q`/`updatedSince`/cursor/limit exist; fixed order
   `createdAt desc, id desc`). **Consequence:** B3's priority filter/sort happens client-side
   after fetching a page.
6. **No "active sprint" filter** on `GET /projects/:id/sprints` (returns all sprints,
   unpaginated) — filtered to `status === "ACTIVE"` client-side.

## New dependencies

- `react-router-dom` (v7 data-router API: `createBrowserRouter`/`RouterProvider`).
- shadcn CLI-add (already configured in `frontend/components.json`, `base-nova` style / `neutral`
  base / `lucide` icons — only `button.tsx` exists today): `avatar`, `badge`, `card`, `table`,
  `dropdown-menu`, `skeleton`, `sonner`, `separator`.
- Not adding: `select` (native `<select>` is enough for the one sort control), `tabs`/`dialog`
  (Board/List toggle is two buttons in a button-group; no modal flow is in scope).

## Routing structure

`frontend/src/app/router.tsx`:
```
createBrowserRouter([
  { element: <AppShellLayout />, children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", element: <DashboardRoute /> },                    // B1
      { path: "projects/:projectId/board", element: <ProjectBoardRoute /> }, // B2
      { path: "projects/:projectId/list", element: <ProjectListRoute /> },   // B3
      { path: "*", element: <NotFoundRoute /> },
  ]},
])
```
Thin route files live in `frontend/src/app/routes/` (`dashboard.tsx`, `project-board.tsx`,
`project-list.tsx`, `not-found.tsx`) — they read `useParams`/`useSearchParams` and hand off to
feature page components, keeping features route-agnostic. URLs use `projectId` (cuid), not
`key` — keys are only unique per-org, so a pretty `/projects/CTY/board` URL would need an extra
org-scoped resolution step; flagged as a future nice-to-have, not needed now.

`AppShellLayout` (`frontend/src/components/layout/AppShellLayout.tsx`) composes a
`CurrentOrgProvider` wrapping a flex row of `<AppSidebar />` + `<main><Outlet /></main>` — the
single place `AppSidebar` mounts. `CurrentUserProvider` (auth gate) sits above the router in
`app/providers.tsx`, not inside the layout route, so it protects all routes uniformly.

`frontend/src/main.tsx` becomes `<StrictMode><AppProviders><AppRouter /></AppProviders></StrictMode>`.
`frontend/index.html`'s `<html>` needs `class="dark"` added — `index.css` already defines a
`.dark` variant but nothing applies it, and the design is dark-theme-only.

## New feature folders (mirrors `features/auth`'s existing `api/`/`components/`/`hooks/`/`types/` shape)

- **`features/tickets/`** — `api/ticketsApi.ts` (`listMyTickets`, `listProjectTickets`,
  `transitionTicket`), `types/index.ts` (`TicketRow`, `Priority`, `TicketFilters`), `hooks/`
  (`useMyTickets`, `useProjectTickets`, `useProjectTicketsSummary`, `useTransitionTicket`),
  `components/` (`TicketCard.tsx` for B2, `TicketRow.tsx` for B3, `TicketListItem.tsx` for B1 —
  three leaf components sharing the same `TicketRow` API type and the same `PriorityIcon`/
  `UserAvatar` primitives, differing only in DOM shape).
- **`features/board/`** — `components/ProjectBoardPage.tsx`, `BoardColumns.tsx`,
  `WorkflowColumn.tsx`. B2-only, no data logic of its own beyond composing `features/tickets` +
  `features/workflow` hooks. **Deliberately thinner than the other feature folders** — no `api/`,
  `hooks/`, or `types/` of its own, since it owns no data — this is page composition, not a
  feature in the same sense as `tickets`/`workflow`/`projects`. If that thinness feels wrong once
  it exists, it can move to `app/routes/project-board.tsx` directly instead of a top-level
  feature folder; not worth deciding now.
- **`features/list/`** — `components/ProjectListPage.tsx`, `TicketFilterBar.tsx`,
  `SortControl.tsx`, `TicketTable.tsx`. B3-only, same composition pattern and same caveat as
  `features/board/` above.
- **`features/projects/`** — `api/projectsApi.ts` (`listOrgProjects`, `getProject`,
  `listProjectMembers`), `types/index.ts` (`ProjectRow`, `EffectiveProjectMember`), `hooks/`
  (`useOrgProjects`, `useProject`, `useProjectMembers` + derived `useProjectMemberMap`,
  dashboard-only `useProjectsByIds`), `components/` (`ProjectTopbar.tsx` — **shared by B2/B3** via
  a `view: "board"|"list"` prop, `ProjectKeyBadge.tsx`).
- **`features/workflow/`** — `api/workflowApi.ts` (`listWorkflowStates`,
  `listWorkflowTransitions`), `types/index.ts`, `hooks/` (`useWorkflowStates`,
  `useWorkflowStateMap`, `useWorkflowTransitions`, `useAvailableTransitions`, dashboard-only
  `useWorkflowStatesByProjectIds`), `lib/stateCategoryStyles.ts` (`Record<StateCategory,
  {dotClassName, label}>`), `components/MoveToMenu.tsx`.
- **`features/sprints/`** — `api/sprintsApi.ts`, `types/index.ts`, `hooks/` (`useSprints`,
  `useActiveSprint`, dashboard-only `useSprintsByProjectIds`).
- **`features/labels/`** — `api/labelsApi.ts`, `types/index.ts`, `hooks/useLabels.ts` (B3 filter
  bar only, per gap #2 above).
- **`features/orgs/`** — `api/orgsApi.ts` (`listOrgs`, `listOrgMembers`), `types/index.ts`,
  `hooks/` (`useOrgs`, `useOrgMembers`), `context/current-org-context.tsx` +
  `hooks/useCurrentOrg.ts` (client-only "selected org" state, defaults to the first org),
  `components/OrgSwitcher.tsx`.
- **`features/dashboard/`** — B1 only. `components/DashboardPage.tsx`, `MyIssuesPanel.tsx`,
  `IssueGroupSection.tsx`, `DashboardRightRail.tsx`, `ActiveProjectCard.tsx`,
  `ActiveSprintCard.tsx`, `RecentActivityPanel.tsx` (static empty-state per gap #3). This is the
  one feature that reaches into the cross-project `*ByProjectIds` hooks (`useQueries` over a
  dynamic project-id set derived from `/me/tickets`).
- **`features/auth/` (extended, not duplicated)** — new `context/current-user-context.tsx`,
  `components/CurrentUserProvider.tsx` (`useQuery(['me'], getMe)`, degrades to a static "sign in
  required" message on 401 — no login flow is in scope), `hooks/useCurrentUser.ts`.

### Shared UI components (design mock → concrete file)

| Mock file | Concrete file | Notes |
|---|---|---|
| `AppSidebar.dc.html` | `components/layout/AppSidebar.tsx` + `SidebarNavItem.tsx`, `ProjectNavList.tsx`, `ProjectNavItem.tsx`, `CurrentUserRow.tsx` | Pulls `useCurrentOrg`/`useOrgProjects`/`useCurrentUser`/`useOrgMembers` internally, no props |
| `Avatar.dc.html` | `components/domain/UserAvatar.tsx` (wraps shadcn `ui/avatar.tsx`) | `{userId, name?, avatarUrl?, size?}` — id-derived fallback glyph when `name` absent (gap #1) |
| `PriorityIcon.dc.html` | `components/domain/PriorityIcon.tsx` | `{priority: Priority}`, lucide icons |
| *(implied by repetition)* | `components/domain/StateDot.tsx`, `components/domain/FilterChip.tsx` | Backed by `stateCategoryStyles.ts`; `FilterChip` reused in `ProjectTopbar` and B3's filter bar |

## Current-user/auth context

Populated once at the top of the tree (`app/providers.tsx`: `QueryClientProvider` →
`CurrentUserProvider` → children), so it's available to the router itself, not coupled to
`AppShellLayout`. Exposes `{user: User | null, isLoading, isError, error}` — not the raw React
Query result, to keep consumers decoupled. This is the only auth guard in scope (no per-route
`<ProtectedRoute>` wrapper needed since the whole app sits behind this one provider). **Known
future gap, acceptable now**: because there's no login screen and one universal 401 message,
there's no "remember where the user was headed" redirect-after-login mechanism today — fine
while there's nowhere to redirect *to*, but will need addressing once a real sign-in flow exists.

## Data-fetching / caching design

Query keys (all via the existing `apiFetch` helper — no new HTTP layer):

| Resource | Key |
|---|---|
| current user | `['me']` |
| orgs / org projects / org members | `['orgs']`, `['orgs', orgId, 'projects']`, `['orgs', orgId, 'members']` |
| one project / members | `['projects', projectId]`, `['projects', projectId, 'members']` |
| workflow states / transitions | `['projects', projectId, 'workflow-states']`, `[..., 'workflow-transitions']` |
| sprints / labels | `['projects', projectId, 'sprints']`, `[..., 'labels']` |
| my tickets | `['me', 'tickets']` (`useInfiniteQuery`) |
| project tickets | `['projects', projectId, 'tickets', normalizedFilters]` (`useInfiniteQuery`) |

**Filter-key normalization** (`features/tickets/lib/normalizeTicketFilters.ts`): strip
`undefined`-valued filter properties before building the query key, so board's call (no
assignee/label/state) and list's call with equivalent filters land on the same cache entry
instead of fragmenting it.

**Eager-all-pages pattern — flagged as a real risk, not just an approximation footnote**: none
of these 3 screens have a "load more" UI, so `useMyTickets`/`useProjectTickets` need to fetch up
to a capped number of pages (e.g. 10 pages / ~2000 tickets) before a board/list is considered
loaded, returning flattened `TicketRow[]` + `{isCapped}` so the UI can show "showing first N"
instead of silently truncating (implements gap #4's approximation). **Implement the page loop
inside the query function itself** — one `queryFn` that `await`s `apiFetch` in a plain `for`/
`while` loop until `nextCursor` is `null` or the cap is hit — **not** as a `useEffect` that
watches `hasNextPage`/calls `fetchNextPage()` and re-triggers itself on the resulting state
change. This means up to 10 *sequential* round trips before a board/list is considered loaded,
multiplied per project by the dashboard's cross-project `useQueries` fan-out, and it's also the
refetch path after every mutation (see optimistic-update note below — mitigated there by not
blocking on it visually). Acceptable for a small seeded dataset; **should be revisited
(virtualized rendering and/or a real "load more"/infinite-scroll UI) before this is exposed to
accounts with large ticket counts** — not a change to make now, but don't treat the cap as a
solved problem.

**Don't reach for `useEffect` to drive this (or similar) sequencing — general rule for this
codebase, not just this one hook.** An effect that watches query state and calls back into that
same query state (`fetchNextPage` → data changes → `hasNextPage` changes → effect re-fires →
`fetchNextPage` again) is an effect chain: the component's actual behavior over time is no
longer visible by reading its body, it's scattered across however many effects react to each
other's side effects. That makes it hard to reason about outside the component, hard to unit
test in isolation, and easy to double-fire under React 19 `StrictMode`'s dev double-invoke of
effects — a real, easy-to-hit bug in exactly this kind of loop. Prefer, in order: derive state
during render: handle sequencing in an event handler; for data fetching specifically, put the
loop inside `queryFn`/`mutationFn` (as above) where React Query already owns the async
lifecycle. Reserve `useEffect` for genuinely external synchronization (subscriptions, DOM/browser
APIs, the future WS client's connection lifecycle) — not for turning one state change into
another.

**Cross-screen cache sharing — real but narrower than it may sound**: `useWorkflowStateMap`/
`useProjectMemberMap`/`useSprints`/`useLabels` are plain per-`projectId` keyed hooks, shared
automatically between B2/B3 with no extra plumbing. The ticket-list cache itself
(`['projects', projectId, 'tickets', normalizedFilters]`) only actually collides between board
and list when list has zero active filters (list's default, unfiltered load) — the moment a
user applies any filter on B3, the keys diverge from board's and no sharing occurs for that
fetch. That's expected (they're legitimately different queries once filtered), just don't expect
filtered-list traffic to warm the board's cache or vice versa.

**Mutation optimistic update (`useTransitionTicket`) — specified, not just asserted**: `onMutate`
snapshots the current `['projects', projectId, 'tickets', normalizedFilters]` infinite-query
data, then uses `setQueryData` to walk `data.pages` and patch the moved ticket's `stateId`/
`version` in place (a small `mapInfinitePages(data, ticketId, patch)` helper in
`features/tickets/lib/`, since the ticket can be on any page). `WorkflowColumn`'s group-by-
`stateId` re-render then reflects the move immediately — the card visibly moves before the
network call resolves. `onError` rolls back to the snapshot and surfaces a toast (409
`ILLEGAL_TRANSITION`/`STALE_STATE` land here). `onSettled` calls
`invalidateQueries({queryKey: ['projects', projectId, 'tickets']})` (prefix match covers every
filter-variant, i.e. list's cache too) plus `['me', 'tickets']` as a cheap safety net — but this
must invalidate in the background (`refetchType: 'active'`, the React Query default) rather than
show the loading-skeleton state, since the optimistic patch already updated the visible UI; the
Skeleton treatment in §Loading states applies only to a query's *first* load, not this
background reconciliation. This whole flow (`onMutate`/`onError`/`onSettled`) lives inside
`useMutation`'s own lifecycle callbacks, not a `useEffect` watching mutation state from outside —
same reasoning as the eager-pagination note above.

**`lib/query-client.ts`** (currently a bare `new QueryClient()`) gets `staleTime: 30_000` +
`retry: 1` defaults added — a real edit, not a new file.

**Future WS hook-in point** (not built now, per scope): because everything is keyed by
`['projects', projectId, resource]`/`['me', resource]`, a later WS handler is just a targeted
`invalidateQueries` call — no hook signatures need to change.

## Per-screen component trees

**B1 — `DashboardPage`**: `MyIssuesPanel` (→ `IssueGroupSection` × categories present →
`TicketListItem` × tickets, with `PriorityIcon` + `UserAvatar`) + `DashboardRightRail`
(`ActiveProjectCard` × top N, `ActiveSprintCard`, `RecentActivityPanel` static empty-state).
Groups by real `StateCategory` (In Progress/Todo/Backlog), **not** the mock's literal "QA"
header — that's a project-specific `WorkflowState.name`, not a category, so it can't generalize
across projects (flagged as a deliberate reinterpretation, not an oversight).

**B2 — `ProjectBoardPage`**: `ProjectTopbar(view="board")` + `BoardColumns` →
`WorkflowColumn` × states in `position` order → `StateDot` + `TicketCard` × tickets in that
state, each with `PriorityIcon`, `UserAvatar`, `MoveToMenu`.

**B3 — `ProjectListPage`**: `ProjectTopbar(view="list")` + `TicketFilterBar` (`FilterChip` ×
active filters + `SortControl`) + `TicketTable` → `TicketRow` × tickets, each with
`PriorityIcon`, `StateDot`, `UserAvatar`.

`ProjectTopbar`'s Board/List toggle navigates between the two sibling routes via `useNavigate`,
preserving `projectId`.

## Loading / empty / error states

- **Loading**: shadcn `Skeleton` rows in place of content (not a spinner, to avoid layout jump).
- **Error**: inline banner + `refetch()` button for list-shaped queries; mutation errors
  (transition 409s: `ILLEGAL_TRANSITION`/`STALE_STATE`) go through a `sonner` toast instead,
  since they're transient and shouldn't block the board.
- **Empty**: not the dedicated "D" empty-state screens (out of scope), just enough not to look
  broken — B1 "No tickets assigned to you"; B2 per-column "No tickets" (columns still render so
  board shape is visible); B3 "No tickets match your filters" + "Clear all" vs. "This project has
  no tickets yet" depending on whether filters are active.

## Accessibility & responsive scope (stated explicitly — plan was previously silent here)

- **Desktop-only for v1**, matching the mock's fixed 1440×900 frames. No responsive breakpoints,
  sidebar collapse, or board horizontal-scroll behavior are designed in this pass — narrower
  viewports are out of scope, not an oversight. Flag before this goes near a real mobile user.
- **Click-based Move (Decision #2) was partly motivated by accessibility** — a dropdown menu is
  natively keyboard/screen-reader operable via shadcn's `dropdown-menu` primitive, unlike raw
  drag-and-drop — but that's the extent of the a11y consideration in this pass. Not designed:
  ARIA live-region announcement when a card moves column (relevant now that the optimistic move
  is instant, per the mutation design above — a screen-reader user gets no equivalent signal),
  and `PriorityIcon`/`StateDot` currently convey state by color/shape alone with a `title` tooltip
  as the only text fallback — sufficient for v1, worth a pass before wider rollout.

## Build sequencing

1. **Router + shell + auth context** — `react-router-dom` install, `app/router.tsx`,
   `AppShellLayout`, `CurrentUserProvider`/`useCurrentUser`, `index.html` dark class,
   `query-client.ts` defaults. Nothing renders real data yet, but the app boots and gates on `/me`.
2. **Shared domain primitives** — shadcn CLI-adds, then `UserAvatar`, `PriorityIcon`, `StateDot`,
   `FilterChip`, `ProjectKeyBadge`.
3. **`features/orgs` + `features/projects` (single-project hooks) + `AppSidebar`** — smallest
   fully-testable vertical slice with real data, no ticket logic yet.
4. **`features/workflow` + `features/sprints` + `features/labels`** — single-project hooks,
   needed by both B2 and B3 before ticket rendering makes sense.
5. **`features/tickets`** — API/hooks/types + the three leaf render components +
   `useTransitionTicket`, buildable/verifiable in isolation against one known project.
6. **B2 board** — smaller surface than B3 (no filter-bar/sort), and exercises the riskiest new
   plumbing (transition mutation + optimistic update + invalidation) — prove it out here first.
7. **B3 list** — additive on top of board's already-proven data layer + shared `ProjectTopbar`.
8. **`features/dashboard` (B1)** — last, because it's the only screen needing the cross-project
   `useQueries`-over-dynamic-ids fan-out pattern, which depends on steps 3–7's hooks existing.

## Open questions / flagged gaps — resolved before frontend build sequencing begins

1. **[Backend] Resolved.** `core-service`'s `GET /orgs/:id/members` and
   `GET /projects/:id/members` now return `name`/`avatarUrl` alongside role/source (Prisma
   `include`/merge in `membershipRepository.ts` / `projectRepository.ts`, covering both
   `ORG`- and `PRIVATE`-visibility projects). B2/B3 assignee identity can use real names for
   any user who's an org/project member; the id-derived fallback glyph is now only needed for
   an assignee/reporter no longer in either list (e.g. removed from the org).
2. **[Product] Decided.** B1's "Active sprint" card shows the first org project with an ACTIVE
   sprint, one card — the plan's original default, confirmed rather than left open. No backend
   aggregate exists for "all of a user's concurrently active sprints"; revisit only if this
   becomes a real product ask.
3. **["New ticket" button] Decided.** Stays disabled/inert with a tooltip for this pass, even
   though `core-service`'s `POST /projects/:id/tickets` already fully supports creation — a
   creation modal (form, validation, assignee picker) is separate scope, not a backend
   dependency.
4. **[No login screen] Resolved differently than originally framed.** The original "degrade to
   a static message on `/me` 401" plan understated the problem: `authPlugin` requires a valid
   `Authorization: Bearer` token on every route except `/health`/`/auth/*`/WS, so without real
   token handling the app would 401 on its first request and never show data at all. The
   frontend now has real token handling — `lib/authToken.ts` (token store + shared in-flight
   refresh coordinator) and `lib/api.ts`'s `apiFetch` (attaches the bearer token, retries once
   through a refresh on 401) — plus `features/auth/lib/devAutoLogin.ts`, which logs in as the
   seeded dev user via the real `/auth/login` endpoint so there's no login *screen* yet, without
   weakening any backend security. A real login screen is still deferred, explicitly until after
   the dashboard work.
5. **[Filter chips are single-select per facet] Decided / accepted limitation.** Confirmed as a
   real, structural constraint — `ticketRepository`'s filters are scalar fields under a Fastify
   JSON Schema, with no `in:`/array support anywhere in the codebase. Lifting this later is a
   genuine filter-API redesign, not attempted now.

## Critical files

- `frontend/src/app/providers.tsx` — where `QueryClientProvider` + `CurrentUserProvider` compose;
  wiring mistakes here break every screen at once.
- `frontend/src/app/router.tsx` — the route table and `AppShellLayout` wrapping relationship all
  3 screens depend on.
- `frontend/src/features/auth/components/CurrentUserProvider.tsx` — the only place `/me` is
  called/cached; every identity decision in the app flows from this.
- `frontend/src/features/tickets/hooks/useProjectTickets.ts` — shared eager-pagination +
  filter-normalization hook both B2 and B3 depend on for coherent caching/invalidation.
- `frontend/src/features/workflow/hooks/useAvailableTransitions.ts` — source of truth for
  `MoveToMenu`'s options; wrong here either hides legal moves or fires a doomed transition.

## Verification (once implementation begins — not run in this planning pass)

- `npm run lint` / `tsc -b` (via `npm run build`) in `frontend/` — strict TS flags
  (`noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`) are already enabled.
- `npm run dev` in `frontend/` against a running `core-service` (`npm run dev` there, seeded via
  `npm run seed`) — manually walk `/dashboard`, `/projects/:id/board`, `/projects/:id/list` for a
  seeded user with assigned tickets across ≥2 projects, confirm: board columns match a project's
  real `workflow-states` order, a transition via `MoveToMenu` persists and survives a refresh, the
  409 `STALE_STATE`/`ILLEGAL_TRANSITION` paths surface a toast instead of a silent failure, and
  the list view's filters/sort behave correctly against real data.
- No new automated tests are scoped in this plan; note that as a gap if the reviewer expects them.
