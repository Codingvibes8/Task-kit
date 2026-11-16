# Task-Kit — Implementation Plan

A modern, workspace-based task manager built with **Next.js 16 (App Router)**, **TypeScript**,
**Tailwind CSS v4**, **Neon Postgres + Drizzle ORM**, and **Clerk**.

> This document is the delivery contract. Every phase has a binary "Done when" gate that can be
> verified by a command, a click-path, or an automated test. Commits are pushed per phase so the
> repository history mirrors this plan.

---

## 1. Product principles

1. **Capture in under three seconds.** Quick-add bar, global shortcut, NLP parsing, and an Inbox.
2. **One task, many views.** The same data renders as Kanban, List, Calendar, and My Day.
3. **Small daily surface.** My Day intentionally resets each morning; the backlog is always one
   click away but never in your face.
4. **Collaboration without chat noise.** Comments, mentions, and activity live on the task.
5. **Typed end to end.** Drizzle schema → Zod input contracts → server actions → client props.
6. **Never trust the client.** Every read and write is scoped to the authenticated member.

---

## 2. Architecture at a glance

```
Browser (RSC + client islands)
   │  server actions / route handlers
   ▼
Next.js App Router (Node runtime)
   ├── Clerk session  ──►  authorization guards (membership + role)
   ├── Drizzle ORM    ──►  Neon Postgres (pooled connection)
   └── Zod contracts  ──►  typed action inputs / outputs
```

| Concern        | Choice                                        | Notes                                                        |
| -------------- | --------------------------------------------- | ------------------------------------------------------------ |
| Runtime        | Node.js (Next.js default)                     | `pg` pool works with Neon and local Postgres                  |
| DB driver      | `pg` → `drizzle-orm/node-postgres`            | Neon is wire-compatible; local Docker is used for verification |
| Auth           | Clerk (`@clerk/nextjs` v7)                    | `proxy.ts` (Next 16 middleware) + server-side guards          |
| Validation     | Zod v4                                        | Shared schemas in `src/lib/validation`                        |
| Styling        | Tailwind v4 CSS-first theme                   | Design tokens in `src/app/globals.css`                        |
| Drag & drop    | `@dnd-kit`                                    | Accessible pointer + keyboard sensor                          |
| Dates          | `date-fns`                                    | UTC storage, user timezone rendering                          |
| NLP            | `chrono-node` + custom `#tag` / `!priority`   | 100 % local, no third-party API                               |
| Notifications  | Web Push + email adapter                      | Providers behind an interface (Phase 8)                       |
| Realtime       | Neon logical replication → SSE / Postgres LISTEN | Phase 9                                                    |

### Route map

```
/                              marketing / redirect
/sign-in, /sign-up             Clerk (catch-all routes)
/dashboard                     home: today, overdue, activity, board preview
/my-day                        curated daily plan
/inbox                         unassigned quick-capture tasks
/projects                      project index
/projects/[projectId]          board | list | calendar tabs
/tasks                         all tasks with filters
/tasks/[taskId]                task detail (subtasks, comments, files)
/calendar                      cross-project time blocking
/settings                      profile, tags, notifications, members
/api/webhooks/clerk            user lifecycle sync (svix verified)
/api/health                    liveness + database probe
```

### Source layout

```
src/
  app/
    (marketing)/                 public landing
    (auth)/                      Clerk hosted components
    (app)/                       authenticated workspace shell
    api/                         webhooks + health
  components/
    board/  calendar/  layout/  tasks/  projects/  ui/
  db/
    schema.ts                    single source of truth
    index.ts                     pooled Drizzle client
    queries/                     typed read helpers
  lib/
    auth.ts  env.ts  nlp.ts  rbac.ts  recurrence.ts  utils.ts
    validation/                  Zod contracts
  server/
    actions/                     "use server" mutations
  types/
```

---

## 3. Data model (Phase 1)

Tables: `users`, `projects`, `project_members`, `project_invites`, `sections`, `tasks`,
`my_day_items`, `tags`, `task_tags`, `comments`, `comment_mentions`, `attachments`, `activities`,
`reminders`, `notifications`.

Key decisions:

- **UUID v4** primary keys for domain rows; Clerk user id is the `users.id` (text).
- **Status enum** `todo | in_progress | done`; **priority** `none | low | medium | high | urgent`.
- **Subtasks** are tasks with `parent_task_id` (recursive, cascade delete).
- **Ordering** uses an integer `position` per column; reordering rewrites a small window (Phase 3).
- **Recurrence** stores an RFC-5545 `RRULE` plus `scheduled | completion` anchor semantics.
- **My Day** is a separate join table so two collaborators can plan the same task on different days.
- **RBAC** lives in `project_members.role` (`owner | admin | member | viewer`).
- **Soft history**: `activities` is append-only; deleting a project nulls its activity references.
- **Indexes** target every hot path: board columns, assignee, due date, reminders, comments.

---

## 4. Phased delivery

### Phase 0 — Foundation, tooling, and repository

**Deliver**

- `create-next-app` scaffold (TypeScript, App Router, `src/`, Tailwind v4).
- Design tokens, fonts, base metadata, `.env.example`, README.
- ESLint, `typecheck`, Drizzle/seed npm scripts.
- This plan.

**Done when**

- `npm run lint` and `npm run typecheck` pass on a clean clone.
- `npm run dev` serves the landing page.
- First commit pushed to `Codingvibes8/Task-kit`.

---

### Phase 1 — Database schema, migrations, and typed data layer

**Deliver**

- `src/db/schema.ts` covering every table above, enums, relations, indexes.
- `src/db/index.ts` pooled client + dev singleton; `src/db/queries/*` typed reads.
- `drizzle.config.ts`, generated SQL migration in `drizzle/`.
- Idempotent seed script with a demo project, sections, tags, and 12 tasks.
- Environment contract (`src/lib/env.ts`) with database + Clerk readiness helpers.

**Done when**

- `npm run db:generate` produces a migration with no diffs on a second run.
- `npm run db:migrate` applies cleanly to an empty Postgres 16 database.
- `npm run db:seed` is idempotent and row counts match the expected fixture.
- `npm run typecheck` passes without `any` in the data layer.

---

### Phase 2 — Authentication, workspace shell, and onboarding

**Deliver**

- `src/proxy.ts` protects every workspace route except marketing, auth, webhook, and health.
- Clerk `<SignIn />` / `<SignUp />`, `<UserButton />`, and a polished sidebar shell.
- `users` row provisioning: Clerk webhook (`user.created|updated|deleted`, svix-verified) plus a
  lazy `ensureUser()` fallback for local development.
- Dev-only preview identity (`DEV_AUTH_BYPASS`) guarded by `NODE_ENV !== "production"`.
- Empty states and a "connect your services" setup card when env vars are missing.

**Done when**

- Signed-out visits to `/dashboard` redirect to `/sign-in` (verified in prod mode).
- First sign-in creates exactly one `users` row; repeat visits do not duplicate it.
- User A cannot read user B's project by guessing a UUID (returns 404).

---

### Phase 3 — Task CRUD and the Kanban board

**Deliver**

- Server actions: `createTask`, `updateTask`, `moveTask`, `deleteTask`, `toggleTaskComplete`.
- Zod contracts + `ActionResult` union (`{ ok: true, data } | { ok: false, error }`).
- Kanban with three columns, dnd-kit drag/drop and keyboard moves, optimistic updates.
- Create/edit dialog, inline priority/due-date chips, delete confirmation, empty states.
- `revalidatePath` scoped to the affected project and `/my-day`.

**Done when**

- Create → appears in To Do without a full reload.
- Drag to In Progress → survives refresh; `position` and `status` persisted.
- Delete → card disappears and a cascade removes its subtasks/comments.
- Every action validates ownership/membership before writing; unauthorized calls return `403`.

---

### Phase 4 — Projects, sections, tags, and subtasks

**Deliver**

- Project CRUD with color, icon, archive; project index grid with progress rings.
- Custom sections (rename, reorder, delete with task re-parenting).
- Tags CRUD + filter bar; task tag editor.
- Subtask checklist on task detail with completion roll-up on the parent.
- Global command palette (`Ctrl/⌘ + K`) for navigation and quick capture.

**Done when**

- A project with custom sections renders those columns in order.
- Deleting a section moves its tasks to the first section, never deletes them.
- Completing every subtask marks the parent as Done (configurable, default on).
- Tag filter survives refresh (URL search params).

---

### Phase 5 — Views: list, calendar, and My Day

**Deliver**

- List view grouped by status/section with inline editing and bulk actions.
- Calendar month/week with drag-to-reschedule; all-day lane.
- My Day: morning prompt, add from "Suggested" (due/overdue/priority), planned order,
  unfinished-task rollover prompt.
- Saved filter chips and URL-addressable view state.

**Done when**

- Switching views preserves project and filters.
- Dragging a task on the calendar writes the new UTC instant and renders in the user's timezone.
- My Day resets the selection each calendar day and never deletes tasks.
- Unfinished My Day tasks surface in the next morning's prompt.

---

### Phase 6 — Frictionless capture (NLP + multi-channel)

**Deliver**

- Persistent quick-add bar + global shortcut; Enter saves, Escape clears.
- NLP: relative/absolute dates, times, recurrence hints, `#tag`, `!priority`, `/project`,
  `@assignee`.
- Parsed preview chips before save, with an "undo parse" affordance.
- Email-to-task: inbound address + provider webhook adapter (Resend/Postmark interface).
- Share-target endpoint (`/api/capture`) for iOS/Android shortcuts; voice notes transcribed
  through a swappable `Transcriber` interface.
- Rate limiting + idempotency keys on the capture endpoint.

**Done when**

- `Meeting with Sarah tomorrow at 3 PM #work !high` yields title `Meeting with Sarah`,
  tomorrow 15:00 local, tag `work`, priority `high` (unit-tested table).
- Duplicate webhook deliveries create one task (idempotency test).
- Quick-add works from any workspace route without navigation.

---

### Phase 7 — Collaboration and permissions

**Deliver**

- Invitations by email with signed, expiring tokens; accept flow.
- Member management UI (role changes, removal, ownership transfer).
- Comments with edit/delete, `@mention` autocomplete, mention notifications.
- Attachments via Vercel Blob (or S3 adapter): presigned upload, size/type limits, virus-scan hook.
- Activity feed per task and per project.
- RBAC matrix: owner / admin / member / viewer; viewers read-only; only owner/admin invite.

**Done when**

- Role matrix is covered by integration tests for every action.
- A viewer receives `403` from every mutating action, including direct action invocation.
- Mention creates exactly one notification and renders the deep link back to the comment.
- Removing a member revokes access immediately (membership re-read per request).

---

### Phase 8 — Reminders, recurrence, and notifications

**Deliver**

- Recurrence engine: daily, weekdays, every N days after completion, monthly nth/last weekday.
- Reminder scheduler (cron route + `reminders` claim query with `FOR UPDATE SKIP LOCKED`).
- In-app notification center, unread badge, mark-all-read.
- Email adapter and Web Push subscriptions; quiet hours and per-project preferences.
- Location reminders: geofence registration on supported clients, graceful fallback elsewhere.

**Done when**

- `RRULE:FREQ=MONTHLY;BYDAY=-1FR` produces the last Friday for 12 consecutive months (unit test).
- "Every 3 days after completion" schedules from `completedAt`, not from the due date.
- Reminder job is idempotent: two concurrent runs send one notification.
- Completing a recurring task creates the next occurrence with the same tag/subtask template.

---

### Phase 9 — Realtime sync and offline mode

**Deliver**

- Realtime invalidation channel (SSE) scoped by project membership.
- Service worker + IndexedDB outbox: optimistic queue with retry and conflict resolution.
- PWA manifest, installable on desktop/mobile, offline shell.
- Presence indicator and "updated by" toast when another member changes a task.

**Done when**

- Two browsers editing the same project see changes under 2 seconds.
- Offline create/complete queues and replays on reconnect without duplicates.
- Lighthouse PWA installability passes; offline shell renders cached project data.
- Conflict rule documented and tested (last-write-wins per field with `updatedAt` guard).

---

### Phase 10 — Quality, security, and release

**Deliver**

- Vitest unit tests (NLP, recurrence, RBAC), integration tests against a disposable database,
  Playwright happy paths.
- GitHub Actions: install → lint → typecheck → unit → build; integration on Postgres service.
- Security review: CSRF-safe actions, rate limits, input caps, SQL-injection review, headers.
- Observability: structured logs, error tracking adapter, `/api/health` probe.
- Vercel deployment, Neon branch per PR, migration runbook, rollback plan.

**Done when**

- CI is green on a fresh fork.
- `npm run build` passes with no secrets present (setup screens render instead).
- Load smoke: 5k tasks in a project keeps board TTFB < 500 ms locally.
- Security checklist signed off in `docs/SECURITY.md`.

---

## 5. Verification commands

```bash
npm run lint          # ESLint
npm run typecheck     # tsc --noEmit
npm run db:generate   # schema → SQL migration
npm run db:migrate    # apply migrations
npm run db:seed       # deterministic fixture data
npm run test          # unit tests (Phase 10)
npm run build         # production build
```

### Local database (optional, no Neon account required)

```bash
docker run --name taskkit-pg -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_USER=postgres -e POSTGRES_DB=taskkit -p 5433:5432 -d postgres:16-alpine
```

```dotenv
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/taskkit
DEV_AUTH_BYPASS=true
```

`DEV_AUTH_BYPASS` is ignored when `NODE_ENV=production` and every authenticated route falls back to
Clerk as soon as the Clerk keys are present.

---

## 6. Progress log

| Phase | Status         | Notes                                                                 |
| ----- | -------------- | --------------------------------------------------------------------- |
| 0     | ✅ Complete    | Scaffold, design tokens, plan, scripts                                 |
| 1     | ✅ Complete    | 15-table schema, migration `0000`, idempotent seed                     |
| 2     | ✅ Complete    | Clerk + dev preview, guarded workspace shell, webhook, setup states    |
| 3     | ✅ Complete    | Task CRUD, optimistic Kanban, delete cascade, ownership checks         |
| 4     | 🟡 In progress | Projects, tags, subtasks done; custom sections UI + command palette left |
| 5     | 🟡 In progress | List, calendar, My Day done; calendar drag + saved filters left        |
| 6     | 🟡 In progress | NLP quick-add done; email/share-target capture + rate limits left      |
| 7     | 🟡 In progress | Comments done; invites, RBAC UI, attachments, activity feed left       |
| 8     | ⏳ Planned     | Recurrence engine, reminders, notifications                            |
| 9     | ⏳ Planned     | Realtime sync, service worker, offline outbox                          |
| 10    | ⏳ Planned     | Tests, CI, security review, deployment                                 |

### Verified so far

- `npm run lint`, `npm run typecheck`, and `npm run build` pass with no secrets present.
- Migration applies cleanly to Postgres 16; `db:seed` is idempotent (1 preview user, 2 projects,
  16 tasks).
- Browser check: Kanban create/drag persists; quick-add `Pay invoice tomorrow 3pm #finance !high`
  parses the title, due instant, tag, and priority; delete cascades and routes back to `/tasks`.
