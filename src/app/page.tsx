import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  Check,
  Command,
  Inbox,
  LayoutGrid,
  ListChecks,
  Sparkles,
  Timer,
  Users,
  Zap,
} from "lucide-react";

import { Brand, Kbd } from "@/components/brand";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const board = [
  {
    label: "To Do",
    dot: "bg-sky",
    cards: [
      {
        title: "Draft Q4 product narrative",
        tag: "writing",
        meta: "Today",
        priority: "High",
        accent: "text-amber",
      },
      {
        title: "Reply to design review thread",
        tag: "team",
        meta: "Wed",
        priority: "Medium",
        accent: "text-lime",
      },
    ],
  },
  {
    label: "In Progress",
    dot: "bg-amber",
    cards: [
      {
        title: "Ship recurring task engine",
        tag: "engineering",
        meta: "Fri",
        priority: "Urgent",
        accent: "text-rose",
        progress: 62,
      },
      {
        title: "Interview 3 early users",
        tag: "research",
        meta: "2 / 3",
        priority: "High",
        accent: "text-amber",
      },
    ],
  },
  {
    label: "Done",
    dot: "bg-accent",
    cards: [
      {
        title: "Quick-add NLP prototype",
        tag: "engineering",
        meta: "Yesterday",
        priority: "Done",
        accent: "text-accent",
      },
    ],
  },
];

const features = [
  {
    icon: Zap,
    kicker: "01 / Capture",
    title: "Get it out of your head in 3 seconds",
    body: "A permanent quick-add bar with local NLP. Type “Call Sam tomorrow 3pm #work !high” and every field lands in the right place — no menus, no friction.",
    points: ["Global shortcut", "Natural dates & tags", "Inbox triage"],
  },
  {
    icon: LayoutGrid,
    kicker: "02 / Organize",
    title: "One dataset. Four ways to think",
    body: "Kanban for momentum, list for linear execution, calendar for time blocking, and My Day for the only thing that matters right now.",
    points: ["Nested projects", "Custom sections", "Tags & filters"],
  },
  {
    icon: Timer,
    kicker: "03 / Finish",
    title: "A daily plan that stays small",
    body: "My Day resets each morning and asks you to choose deliberately. Overdue work surfaces, but never hijacks the board you curated.",
    points: ["Morning prompt", "Rollover without guilt", "Focus streak"],
  },
];

export default function LandingPage() {
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[640px] grid-backdrop" />
      <div className="pointer-events-none absolute left-1/2 top-[-180px] h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-accent/10 blur-[120px]" />

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Brand />
        <nav className="hidden items-center gap-8 text-sm text-muted md:flex">
          <a className="transition hover:text-ink" href="#product">
            Product
          </a>
          <a className="transition hover:text-ink" href="#views">
            Views
          </a>
          <a className="transition hover:text-ink" href="#principles">
            Principles
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/sign-in"
            className="hidden rounded-xl px-3 py-2 text-sm text-muted transition hover:text-ink sm:block"
          >
            Sign in
          </Link>
          <Link href="/dashboard">
            <Button size="sm" className="h-9 px-4">
              Open workspace
              <ArrowUpRight className="size-3.5" />
            </Button>
          </Link>
        </div>
      </header>

      <main className="relative z-10">
        {/* Hero */}
        <section className="mx-auto grid w-full max-w-6xl gap-14 px-6 pb-20 pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pt-20">
          <div className="animate-float-in">
            <div className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-surface/70 px-3 py-1.5 text-[11px] text-muted backdrop-blur">
              <span className="size-1.5 rounded-full bg-accent" />
              <span className="font-mono uppercase tracking-[0.18em]">
                Task management, minus the noise
              </span>
            </div>

            <h1 className="mt-6 max-w-xl text-balance text-5xl font-semibold leading-[1.02] tracking-[-0.045em] sm:text-6xl">
              Capture the thought.
              <br />
              <span className="text-accent">Finish the day.</span>
            </h1>

            <p className="mt-6 max-w-lg text-pretty text-[15px] leading-relaxed text-muted">
              Task-Kit is a keyboard-first workspace for people who are tired of
              managing their task manager. Quick capture, honest priorities, and
              a daily plan that resets before it becomes a graveyard.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/dashboard">
                <Button size="lg">
                  Start with a workspace
                  <ArrowUpRight className="size-4" />
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button size="lg" variant="outline">
                  <Command className="size-4" />
                  Sign in
                </Button>
              </Link>
            </div>

            <div className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-faint">
              <span className="inline-flex items-center gap-1.5">
                <Check className="size-3.5 text-accent" /> Free personal
                workspace
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="size-3.5 text-accent" /> Clerk-secured
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="size-3.5 text-accent" /> Neon + Drizzle
              </span>
            </div>

            {/* Quick add preview */}
            <div className="mt-10 max-w-lg">
              <div className="flex items-center gap-2 rounded-2xl border border-line-strong bg-surface/90 p-2 shadow-panel backdrop-blur">
                <span className="grid size-9 place-items-center rounded-xl bg-accent/10 text-accent ring-1 ring-inset ring-accent/20">
                  <Sparkles className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] text-ink">
                    Call Sam about launch{" "}
                    <span className="text-accent">tomorrow 3pm</span>{" "}
                    <span className="text-violet">#work</span>{" "}
                    <span className="text-amber">!high</span>
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-[10px] text-faint">
                    <Badge tone="accent">Tomorrow · 15:00</Badge>
                    <Badge>#work</Badge>
                    <Badge tone="warning">High</Badge>
                  </div>
                </div>
                <Kbd>↵</Kbd>
              </div>
              <p className="mt-2 pl-1 font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
                Natural language · parsed locally
              </p>
            </div>
          </div>

          {/* Board preview */}
          <div className="animate-float-in [animation-delay:120ms]">
            <div className="relative rounded-4xl border border-line-strong bg-surface/80 p-3 shadow-panel backdrop-blur">
              <div className="flex items-center justify-between px-2 py-2">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-rose/70" />
                  <span className="size-2 rounded-full bg-amber/70" />
                  <span className="size-2 rounded-full bg-accent/70" />
                </div>
                <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-faint">
                  launch · board
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {board.map((column) => (
                  <div
                    key={column.label}
                    className="rounded-2xl border border-line bg-canvas/60 p-2"
                  >
                    <div className="mb-2 flex items-center gap-1.5 px-1">
                      <span className={`size-1.5 rounded-full ${column.dot}`} />
                      <span className="text-[10px] font-medium text-muted">
                        {column.label}
                      </span>
                      <span className="ml-auto font-mono text-[9px] text-faint">
                        {column.cards.length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {column.cards.map((card) => (
                        <div
                          key={card.title}
                          className="rounded-xl border border-line bg-surface-2 p-2.5 shadow-[0_10px_20px_-18px_black]"
                        >
                          <p className="text-[11px] leading-snug text-ink">
                            {card.title}
                          </p>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="rounded-md bg-white/5 px-1.5 py-0.5 font-mono text-[8px] text-faint">
                              #{card.tag}
                            </span>
                            <span className={`text-[8px] ${card.accent}`}>
                              {card.priority}
                            </span>
                          </div>
                          {"progress" in card && card.progress ? (
                            <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/5">
                              <div
                                className="h-full rounded-full bg-accent"
                                style={{ width: `${card.progress}%` }}
                              />
                            </div>
                          ) : null}
                          <div className="mt-2 flex items-center justify-between text-[8px] text-faint">
                            <span>{card.meta}</span>
                            <span className="grid size-4 place-items-center rounded-full bg-white/5">
                              {card.title[0]}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-2 flex items-center justify-between rounded-2xl border border-line bg-surface-2/70 px-3 py-2.5">
                <div className="flex items-center gap-2 text-[10px] text-muted">
                  <Command className="size-3" />
                  <span>Quick capture</span>
                  <Kbd>⌘</Kbd>
                  <Kbd>K</Kbd>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-accent">
                  <span className="size-1.5 rounded-full bg-accent animate-pulse-soft" />
                  synced
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust strip */}
        <section className="border-y border-line/70 bg-surface/40">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-6 px-6 py-6">
            {[
              ["Local NLP", "chrono-node + custom tokens"],
              ["Strictly typed", "Drizzle → Zod → actions"],
              ["Secure by default", "Clerk + row-level guards"],
              ["Postgres-native", "Neon · indexes on every hot path"],
            ].map(([title, sub]) => (
              <div key={title}>
                <p className="text-[12px] font-medium text-ink">{title}</p>
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
                  {sub}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Product */}
        <section id="product" className="mx-auto w-full max-w-6xl px-6 py-24">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent">
                What it does
              </p>
              <h2 className="mt-3 max-w-2xl text-balance text-4xl font-semibold tracking-[-0.03em]">
                Built around the moment work actually happens.
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-muted">
              Most tools optimize for storing tasks. Task-Kit optimizes for the
              three moments that decide whether work ships: capture, choosing,
              and finishing.
            </p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="group rounded-3xl border border-line bg-surface/60 p-6 transition hover:border-line-strong hover:bg-surface"
              >
                <div className="flex items-center justify-between">
                  <span className="grid size-10 place-items-center rounded-2xl bg-accent/10 text-accent ring-1 ring-inset ring-accent/20">
                    <feature.icon className="size-4.5" />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
                    {feature.kicker}
                  </span>
                </div>
                <h3 className="mt-6 text-lg font-medium leading-snug tracking-tight">
                  {feature.title}
                </h3>
                <p className="mt-3 text-[13px] leading-relaxed text-muted">
                  {feature.body}
                </p>
                <ul className="mt-5 space-y-2 border-t border-line pt-4">
                  {feature.points.map((point) => (
                    <li
                      key={point}
                      className="flex items-center gap-2 text-[12px] text-muted"
                    >
                      <Check className="size-3.5 text-accent" />
                      {point}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        {/* Views */}
        <section
          id="views"
          className="relative border-y border-line/70 bg-surface/30"
        >
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-24 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent">
                One source of truth
              </p>
              <h2 className="mt-3 text-balance text-4xl font-semibold tracking-[-0.03em]">
                Four views. Zero duplicate data.
              </h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
                Change a status on the board and it is already true in the list,
                the calendar, and the daily plan. The view is a lens, not a
                second database.
              </p>

              <div className="mt-8 space-y-2">
                {[
                  {
                    icon: LayoutGrid,
                    title: "Kanban",
                    body: "Columns per status or custom sections. Drag with mouse or keyboard.",
                  },
                  {
                    icon: ListChecks,
                    title: "List",
                    body: "Dense, linear execution with inline edits and bulk actions.",
                  },
                  {
                    icon: CalendarDays,
                    title: "Calendar",
                    body: "Time-block against real due dates; reschedule by dragging.",
                  },
                  {
                    icon: Inbox,
                    title: "My Day",
                    body: "A deliberately small plan that resets every morning.",
                  },
                ].map((view) => (
                  <div
                    key={view.title}
                    className="flex items-start gap-3 rounded-2xl border border-transparent p-3 transition hover:border-line hover:bg-surface-2/60"
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-white/5 text-muted">
                      <view.icon className="size-4" />
                    </span>
                    <div>
                      <p className="text-sm font-medium">{view.title}</p>
                      <p className="text-[12px] leading-relaxed text-faint">
                        {view.body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-6 rounded-[2.5rem] bg-accent/5 blur-2xl" />
              <div className="relative overflow-hidden rounded-3xl border border-line-strong bg-surface p-5 shadow-panel">
                <div className="flex items-center justify-between border-b border-line pb-4">
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-faint">
                      my day · mon 16 nov
                    </p>
                    <p className="mt-1 text-lg font-medium tracking-tight">
                      Three things, then stop.
                    </p>
                  </div>
                  <Badge tone="accent">2 / 3</Badge>
                </div>
                <div className="mt-4 space-y-2">
                  {[
                    ["Finish pricing narrative", "Focus · 90m", true],
                    ["Review onboarding flow", "Design · 45m", true],
                    ["Write launch checklist", "Eng · 30m", false],
                  ].map(([title, meta, done]) => (
                    <div
                      key={title as string}
                      className="flex items-center gap-3 rounded-2xl border border-line bg-surface-2/70 p-3"
                    >
                      <span
                        className={`grid size-5 place-items-center rounded-full border ${
                          done
                            ? "border-accent bg-accent text-accent-ink"
                            : "border-line-strong"
                        }`}
                      >
                        {done ? <Check className="size-3" /> : null}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`truncate text-[13px] ${
                            done ? "text-faint line-through" : "text-ink"
                          }`}
                        >
                          {title}
                        </p>
                        <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-faint">
                          {meta}
                        </p>
                      </div>
                      <span className="size-1.5 rounded-full bg-accent/70" />
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between rounded-2xl border border-dashed border-line-strong px-3 py-2.5 text-[11px] text-faint">
                  <span>Add from suggested · 7 waiting</span>
                  <PlusGlyph />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Principles */}
        <section id="principles" className="mx-auto w-full max-w-6xl px-6 py-24">
          <div className="grid gap-4 md:grid-cols-4">
            {[
              {
                title: "No guilt mechanics",
                body: "No streak-shaming, no red badges for a life well lived.",
              },
              {
                title: "Keyboard first",
                body: "Every core action is one shortcut away, including capture.",
              },
              {
                title: "Your data, guarded",
                body: "Membership is re-checked on every read and every mutation.",
              },
              {
                title: "Provider optional",
                body: "Clerk, Neon, and email adapters sit behind clean interfaces.",
              },
            ].map((item, index) => (
              <div
                key={item.title}
                className="rounded-3xl border border-line bg-surface/50 p-5"
              >
                <span className="font-mono text-[10px] text-accent">
                  0{index + 1}
                </span>
                <h3 className="mt-4 text-sm font-medium">{item.title}</h3>
                <p className="mt-2 text-[12px] leading-relaxed text-muted">
                  {item.body}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-16 flex flex-col items-start justify-between gap-6 rounded-4xl border border-line-strong bg-surface p-8 shadow-panel md:flex-row md:items-center">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
                Ready when you are
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                Open the workspace. Type the first thought.
              </h2>
              <p className="mt-2 text-sm text-muted">
                Personal plan is free. Bring a team when you need one.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/dashboard">
                <Button size="lg">
                  Open Task-Kit
                  <ArrowUpRight className="size-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line/70">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-4 px-6 py-8 text-[11px] text-faint sm:flex-row sm:items-center">
          <div className="flex items-center gap-2.5">
            <Brand compact href="/" />
            <span className="font-mono uppercase tracking-[0.16em]">
              Task-Kit · built with Next.js, Drizzle & Clerk
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <Users className="size-3.5" />
              Personal & team workspaces
            </span>
            <span>© {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function PlusGlyph() {
  return (
    <span className="grid size-5 place-items-center rounded-full border border-line-strong text-muted">
      +
    </span>
  );
}
