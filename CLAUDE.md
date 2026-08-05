# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

This repo currently contains one package, `core-service/` — the system of record for a ticket tracker (data, business rules, REST API, and a WebSocket real-time feed). All commands below are run from inside `core-service/`. A frontend and an `agent-service` are planned but not yet present; don't assume code for them exists.

## Git hooks

A pre-commit hook lives at `.githooks/pre-commit` (tracked in git, not `.git/hooks/`). It no-ops unless the commit touches `core-service/`, then runs strict typecheck, lint, a non-blocking `npm audit --audit-level=high` (prints findings but never fails the commit — there are pre-existing high/critical findings in the fastify and vite/vitest dependency chains that need a breaking-version upgrade to clear), and sanity checks (`test:unit` + `boundaries`). It is **not** enabled by default on a fresh clone — run this once per clone to activate it:

```
git config core.hooksPath .githooks
```

## Commands (run from `core-service/`)

```
npm run dev              # tsx watch src/server.ts — local dev server
npm run build             # tsc -p tsconfig.json
npm run typecheck         # tsc --noEmit
npm run lint               # eslint . --ext .ts
npm run boundaries         # dependency-cruiser — enforces the layering rules below

npm test                   # vitest run (unit tests only by default config)
npm run test:unit          # vitest run test/unit
npm run test:watch         # vitest, watch mode

npm run test:integration   # vitest against a real Postgres DB — see "Integration tests" below

npm run prisma:generate    # regenerate the Prisma client after a schema change
npm run prisma:migrate     # create + apply a dev migration
npm run prisma:deploy      # apply migrations non-interactively (CI/prod)
npm run seed                # tsx prisma/seed.ts
```

Run a single test file: `npx vitest run test/unit/authz.test.ts`. Run a single integration file: `npx vitest run --config vitest.integration.config.ts test/integration/tickets.test.ts`.

### Integration tests need Postgres

`test:integration` truncates real tables between tests (`test/fixtures/db.ts`) and hits a live database at `TEST_DATABASE_URL`. There's no committed docker-compose file — Postgres must already be reachable at the host/port in `.env` (see `.env.example`; the project defaults to port `5433`, not `5432`, to avoid clashing with a native Postgres install). `scripts/init-multiple-dbs.sh` creates both the dev DB and the `_test` DB and enables the `pg_trgm` extension each needs. `test/integration/setupEnv.ts` swaps `DATABASE_URL` for `TEST_DATABASE_URL` before `prismaClient.ts` is ever imported — integration tests must never run against the dev database.

## Architecture

### Layering, enforced by `dependency-cruiser` (`npm run boundaries`)

```
routes/  →  services/  →  repositories/  →  Prisma
```

- Only `src/repositories/**` may import `@prisma/client`. Routes may not import Prisma or repositories directly — they call domain services.
- Each service module exports its own dependency interface (e.g. `TicketServiceDeps`, `MembershipServiceDeps`) rather than depending on Prisma types, so services stay unit-testable without a database. Repository modules (`src/repositories/*Repository.ts`) implement those interfaces against Prisma.
- `src/deps.ts` is the single wiring point: it composes concrete repositories + the shared `EventBus` into each service's deps object (`ticketDeps`, `commentDeps`, etc.) and is what routes import.
- `npm run boundaries` will fail the build if this layering is violated — run it after moving code between layers.

### Authorization

All access control goes through one function: `can(deps, actor, action, resource)` in `src/services/authz.ts`. It's resource-shaped (`{ kind: "org" | "project" | "comment" }`) and returns `"ALLOW" | "FORBIDDEN" | "NOT_FOUND"` — services map `NOT_FOUND` to a 404 and `FORBIDDEN` to a 403, so a caller with no access to a resource can't distinguish "doesn't exist" from "exists but you can't see it."

Project-level access is resolved by `resolveProjectRole()`, which combines the actor's org role with an optional per-project `ProjectMembership` override, and accounts for project `visibility` (`ORG` vs `PRIVATE`). Every service that needs a project permission check goes through this, not a hand-rolled query.

### Error handling

There is exactly one `setErrorHandler` (`src/errors/errorHandler.ts`). Route handlers never call `reply.code(...).send(...)` for an error case — they throw a subclass of `AppError` (`src/errors/AppError.ts`) and the handler collapses it to `{ error: { code, message, details } }`. `src/errors/codes.ts` is the single source of truth mapping each `ErrorCode` to an HTTP status. Anything not an `AppError` (a bug, an unhandled Prisma error) is logged server-side and collapsed to a generic `INTERNAL_ERROR` — raw stack traces/constraint messages never reach the client.

### Optimistic concurrency on tickets

`Ticket.version` is an optimistic-concurrency token. Every mutating write (`updateTicketIfVersionMatches`, `transitionTicketState` in `src/repositories/ticketRepository.ts`) is a conditional `updateMany({ where: { id, version: expectedVersion, ... } })` inside a transaction, never a read-then-write. Zero rows affected means someone else wrote first, which the service layer turns into a `StaleStateError` (409). Ticket numbering (`Project.nextTicketNo`) uses the same pattern — an atomic `{ increment: 1 }` update takes Postgres's row lock, so concurrent creates are serialized by the database, not the app.

### Real-time (WebSocket)

`src/services/eventBus.ts` is an in-process `EventBus` (pub/sub over a `Set` of listeners, per-project monotonic `seq` numbers). Services publish domain events (`ticket.created`, `ticket.updated`, `comment.created`, etc.) after a successful write; `src/routes/ws.routes.ts` subscribes per-connection and forwards events for projects the client has subscribed to (after checking `resolveProjectRole` at subscribe time, not just at connect time).

This only works single-instance: `scripts/verifyReplicaCount.ts` makes the process refuse to boot if `REPLICA_COUNT > 1`, since scaling out requires swapping the in-process bus for something like Redis pub/sub first.

WebSocket auth is out-of-band from the HTTP upgrade: clients connect unauthenticated and must send `{ action: "auth", token }` as the first frame within 5s, so no access token ever lands in a proxy/load-balancer access log via the URL.

### Pagination

Cursor-based, consistent across every list endpoint that needs it (`src/repositories/pagination.ts`). The cursor encodes `(createdAt, id)` base64url-encoded; `cursorWhereDesc()` produces the `OR` clause for "strictly before this point," and results are always ordered `[{ createdAt: "desc" }, { id: "desc" }]`. When combining a cursor condition with another `OR`-based filter (e.g. full-text search on `q`), wrap both in a top-level `AND: [...]` — putting them in the same object lets one silently clobber the other's `OR` key.

### Cross-cutting DB integrity Prisma can't express

A few invariants are enforced by raw-SQL Postgres triggers/constraints added via migrations rather than declarative Prisma relations, because Prisma can't model them directly (documented inline in `prisma/schema.prisma` at each spot): cross-project scoping of a ticket's sprint and labels, and a `pg_trgm` GIN index backing the `q` ticket search. When adding a new cross-entity constraint, check whether Prisma can express it before reaching for a raw migration.

## Commit messages

This repo follows [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/):

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

- `type` is one of: `feat`, `fix`, `build`, `chore`, `ci`, `docs`, `style`, `refactor`, `perf`, `test` (or another type agreed on with the team).
- A `!` after the type/scope, or a `BREAKING CHANGE:` footer, marks a breaking change (e.g. `feat!: ...` or `feat(api)!: ...`).
- The description is a short, imperative summary; longer rationale goes in the body.
- Footers use `token: value` or `token #value` form (e.g. `Refs: #123`, `Reviewed-by: ...`), with multi-word tokens hyphenated (`BREAKING-CHANGE` excepted).
