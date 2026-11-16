# Task-Kit

A workspace-based task manager for people who capture fast and plan a small, deliberate day.

Built with **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS v4**, **PostgreSQL + Drizzle ORM**,
and **Clerk**.

![stack](https://img.shields.io/badge/Next.js-16-black) ![stack](https://img.shields.io/badge/TypeScript-strict-blue)
![stack](https://img.shields.io/badge/Postgres-16-336791) ![stack](https://img.shields.io/badge/Clerk-auth-6c47ff)

---

## What it does today

| Area | Status |
| --- | --- |
| Projects, sections (schema), tags, subtasks | ✅ Project CRUD/archive, tag editor, subtask checklist |
| Task CRUD | ✅ Create, edit, move, complete, delete with confirmation |
| Kanban | ✅ Three columns, dnd-kit drag & drop, optimistic moves |
| List & Calendar | ✅ Grouped list, month calendar |
| Quick capture | ✅ NLP for dates/times, `#tag`, `!priority`, `/project` |
| My Day | ✅ Per-user daily plan, add/remove, suggestions |
| Comments & activity | ✅ Threaded task comments |
| Auth & tenancy | ✅ Clerk, per-workspace membership checks on every read/write |
| Settings & health | ✅ Profile, tags, `/api/health` database probe |

Planned next: invitations and RBAC UI, attachments, recurrence engine, reminders/notifications,
realtime sync, and offline mode. The full delivery contract lives in
[`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md).

---

## Quickstart

### 1. Install

```bash
npm install
```

### 2. Start Postgres

Any Postgres 16 instance works, including [Neon](https://neon.tech). For a local database:

```bash
docker run --name taskkit-pg \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=taskkit \
  -p 5433:5432 -d postgres:16-alpine
```

### 3. Configure environment

```bash
cp .env.example .env.local
```

```dotenv
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/taskkit
DEV_AUTH_BYPASS=true
```

`DEV_AUTH_BYPASS=true` signs you in as a local preview user
(`preview@taskkit.local`) so you can develop without Clerk keys. It is ignored whenever
`NODE_ENV=production` or Clerk keys are present.

To use real authentication, add your Clerk keys and the webhook secret:

```dotenv
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
```

Point the Clerk webhook at `POST /api/webhooks/clerk` (`user.created`, `user.updated`,
`user.deleted`).

### 4. Migrate and seed

```bash
npm run db:migrate
npm run db:seed
```

### 5. Run

```bash
npm run dev
```

Open <http://localhost:3000>. Without any secrets the app renders a setup notice instead of
crashing, so a fresh clone always builds.

---

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Development server (Turbopack) |
| `npm run build` / `npm start` | Production build and serve |
| `npm run lint` | ESLint (Next.js config) |
| `npm run typecheck` | `tsc --noEmit`, strict mode |
| `npm run db:generate` | Generate SQL from `src/db/schema.ts` |
| `npm run db:migrate` | Apply migrations in `drizzle/` |
| `npm run db:push` | Push schema directly (prototyping only) |
| `npm run db:studio` | Drizzle Studio |
| `npm run db:seed` | Idempotent demo workspace (2 projects, 16 tasks) |
| `npm run db:setup` | Migrate + seed |

---

## Architecture

```
src/
  app/
    (marketing)               landing page
    (auth)                    Clerk sign-in / sign-up
    (app)                     authenticated shell
      dashboard               today, overdue, activity, board preview
      my-day                  curated daily plan
      inbox                   unassigned quick captures
      projects/[projectId]    board | list | calendar
      tasks/[taskId]          detail, subtasks, comments
      settings                profile, tags
    api/
      health                  liveness + database probe
      webhooks/clerk          user lifecycle sync
  components/                 board, calendar, tasks, layout, ui
  db/
    schema.ts                 single source of truth (15 tables)
    index.ts                  lazy pooled Drizzle client
    queries/                  typed read helpers
  lib/
    auth.ts                   session user + provisioning
    env.ts                    configuration readiness
    nlp.ts                    chrono-node + #tag / !priority / /project
    rbac.ts                   role capabilities
    validation.ts             Zod contracts
  server/
    actions/                  "use server" mutations
    access.ts                 task access + capability guard
  proxy.ts                    Clerk middleware / route protection
```

**Data flow.** Server Components read through typed helpers in `src/db/queries`; all mutations are
server actions that validate input with Zod, resolve the session user, re-check membership via
`src/server/access.ts`, write with Drizzle, and `revalidatePath` the affected routes.

**Data model.** `users`, `projects`, `project_members`, `project_invites`, `sections`, `tasks`,
`my_day_items`, `tags`, `task_tags`, `comments`, `comment_mentions`, `attachments`, `activities`,
`reminders`, `notifications`. Status is `todo | in_progress | done`; priority is
`none | low | medium | high | urgent`. Subtasks are tasks with `parent_task_id`.

**Auth & tenancy.** `src/proxy.ts` protects every workspace route. The webhook plus a lazy
`ensureUser()` fallback provisions the `users` row. Every project/task read and write is scoped to
the authenticated member; guessing another user's UUID returns 404/403 rather than leaking data.

---

## Verification

```bash
npm run lint
npm run typecheck
npm run build
```

Against a live database:

```bash
npm run db:generate   # second run should report no schema changes
npm run db:migrate
npm run db:seed       # repeatable; reports user + 2 projects + 16 tasks
```

Manual happy path: create a task from the board → drag it to In Progress → refresh → confirm it
persisted; run `Pay invoice tomorrow 3pm #finance !high` through quick-add and confirm the parsed
title, due date, tag, and priority; delete the task and confirm a cascade.

---

## License

Private project. All rights reserved.
