import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock,
  FolderKanban,
  Sparkles,
  Sun,
  Timer,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { QuickAddButton } from "@/components/quick-add";
import { TaskRow } from "@/components/tasks/task-row";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getActivityFeed,
  getMyOpenTasks,
  getTaskStatusCounts,
} from "@/db/queries/tasks";
import { listProjectsForUser } from "@/db/queries/projects";
import { getSessionUser } from "@/lib/auth";
import { cn, isOverdue, relativeTime } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function activityLabel(
  type: string,
  actorName: string | null,
  data: Record<string, unknown>,
): string {
  const actor = actorName ?? "Someone";
  const title = typeof data.title === "string" ? data.title : null;

  switch (type) {
    case "task.created":
      return `${actor} captured ${title ? `“${title}”` : "a task"}`;
    case "task.captured":
      return `${actor} quick-captured ${title ? `“${title}”` : "a task"}`;
    case "task.completed":
      return `${actor} completed ${title ? `“${title}”` : "a task"}`;
    case "task.moved":
      return `${actor} moved a task to ${String(data.to ?? "a new column").replace("_", " ")}`;
    case "project.created":
      return `${actor} created a project`;
    case "comment.created":
      return `${actor} left a comment`;
    case "myday.added":
      return `${actor} added a task to My Day`;
    default:
      return `${actor} updated the workspace`;
  }
}

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");

  const [counts, tasks, projects] = await Promise.all([
    getTaskStatusCounts(user.id),
    getMyOpenTasks(user.id, 40),
    listProjectsForUser(user.id),
  ]);

  const activity = await getActivityFeed(
    projects.slice(0, 20).map((project) => project.id),
    7,
  );

  const dueToday = tasks.filter((task) => {
    if (!task.dueDate) return false;
    const due = new Date(task.dueDate);
    const now = new Date();
    return (
      due.getFullYear() === now.getFullYear() &&
      due.getMonth() === now.getMonth() &&
      due.getDate() === now.getDate()
    );
  });

  const overdue = tasks.filter((task) => isOverdue(task.dueDate));
  const openCount = counts.todo + counts.in_progress;
  const focus = dueToday[0] ?? tasks[0] ?? null;

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Workspace · overview"
        title={`${greeting()}, ${user.firstName ?? "there"}.`}
        description={
          openCount === 0
            ? "The board is clear. Capture the next thought whenever it arrives."
            : `${openCount} open ${openCount === 1 ? "task" : "tasks"}${dueToday.length > 0 ? ` · ${dueToday.length} due today` : ""}${overdue.length > 0 ? ` · ${overdue.length} overdue` : ""}.`
        }
        actions={
          <>
            <QuickAddButton className="inline-flex h-9 items-center gap-2 rounded-xl bg-accent px-3.5 text-[12px] font-medium text-accent-ink transition hover:bg-accent-soft">
              <Sparkles className="size-3.5" />
              Capture task
            </QuickAddButton>
            <Link href="/projects">
              <Button variant="outline" size="sm" className="h-9 px-3.5">
                <FolderKanban className="size-3.5" />
                Projects
              </Button>
            </Link>
          </>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            label: "To do",
            value: counts.todo,
            icon: Circle,
            tone: "text-sky",
            hint: "queued",
          },
          {
            label: "In progress",
            value: counts.in_progress,
            icon: Timer,
            tone: "text-amber",
            hint: "moving",
          },
          {
            label: "Done",
            value: counts.done,
            icon: CheckCircle2,
            tone: "text-accent",
            hint: "shipped",
          },
          {
            label: "Overdue",
            value: counts.overdue,
            icon: Clock,
            tone: counts.overdue > 0 ? "text-rose" : "text-faint",
            hint: "needs a call",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-line bg-surface/50 p-4"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
                {stat.label}
              </span>
              <stat.icon className={cn("size-3.5", stat.tone)} />
            </div>
            <p className="mt-3 text-3xl font-semibold tracking-tight">
              {stat.value}
            </p>
            <p className="mt-0.5 text-[10px] text-faint">{stat.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.55fr_1fr]">
        <div className="space-y-6">
          {/* Up next */}
          <section className="rounded-3xl border border-line bg-surface/40">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <div>
                <p className="text-sm font-medium">Up next</p>
                <p className="text-[11px] text-faint">
                  Open work, earliest due first
                </p>
              </div>
              <Link
                href="/tasks"
                className="inline-flex items-center gap-1 text-[11px] text-muted transition hover:text-accent"
              >
                View all
                <ArrowUpRight className="size-3" />
              </Link>
            </div>

            <div className="space-y-2 p-3">
              {tasks.slice(0, 7).map((task) => (
                <TaskRow key={task.id} task={task} showProject />
              ))}

              {tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
                  <div className="grid size-10 place-items-center rounded-2xl bg-accent/10 text-accent">
                    <CheckCircle2 className="size-4.5" />
                  </div>
                  <p className="mt-3 text-sm font-medium">Nothing open</p>
                  <p className="mt-1 max-w-xs text-[12px] text-faint">
                    Quick capture is one shortcut away. Press ⌘K and type the
                    next thought.
                  </p>
                  <QuickAddButton className="mt-4 inline-flex h-8 items-center gap-1.5 rounded-lg bg-white/5 px-3 text-[11px] text-muted ring-1 ring-line transition hover:text-ink">
                    Capture something
                  </QuickAddButton>
                </div>
              ) : null}
            </div>
          </section>

          {/* Projects */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Projects</p>
                <p className="text-[11px] text-faint">
                  Momentum across every active workspace
                </p>
              </div>
              <Link
                href="/projects"
                className="inline-flex items-center gap-1 text-[11px] text-muted transition hover:text-accent"
              >
                Manage
                <ArrowUpRight className="size-3" />
              </Link>
            </div>

            {projects.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-line px-6 py-8 text-center">
                <p className="text-sm font-medium">No projects yet</p>
                <p className="mt-1 text-[12px] text-faint">
                  Create a project to group tasks, or keep capturing into the
                  Inbox.
                </p>
                <Link href="/projects" className="mt-4 inline-block">
                  <Button size="sm">Create a project</Button>
                </Link>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {projects.slice(0, 4).map((project) => {
                  const progress =
                    project.taskCount === 0
                      ? 0
                      : Math.round((project.doneCount / project.taskCount) * 100);

                  return (
                    <Link
                      key={project.id}
                      href={`/projects/${project.id}`}
                      className="group rounded-2xl border border-line bg-surface/50 p-4 transition hover:border-line-strong hover:bg-surface"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="size-2 rounded-[3px]"
                          style={{ backgroundColor: project.color }}
                        />
                        <p className="truncate text-[13px] font-medium">
                          {project.name}
                        </p>
                        <ArrowUpRight className="ml-auto size-3.5 text-faint transition group-hover:text-accent" />
                      </div>
                      <div className="mt-4 flex items-center justify-between text-[10px] text-faint">
                        <span>
                          {project.doneCount}/{project.taskCount} done
                        </span>
                        <span>{progress}%</span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/5">
                        <div
                          className="h-full rounded-full bg-accent/80"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Right rail */}
        <div className="space-y-6">
          <section className="rounded-3xl border border-accent/20 bg-linear-to-b from-accent/[0.07] to-transparent p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-xl bg-accent/15 text-accent">
                  <Sun className="size-4" />
                </span>
                <div>
                  <p className="text-[13px] font-medium">My Day</p>
                  <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-faint">
                    {dueToday.length} due today
                  </p>
                </div>
              </div>
              <Badge tone="accent">curated</Badge>
            </div>

            {focus ? (
              <div className="mt-4 rounded-2xl border border-line bg-canvas/40 p-3">
                <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
                  Next focus
                </p>
                <p className="mt-1.5 line-clamp-2 text-[13px] leading-snug">
                  {focus.title}
                </p>
                <div className="mt-2 flex items-center gap-2 text-[10px] text-faint">
                  <CalendarDays className="size-3" />
                  {focus.dueDate ? "Due soon" : "No due date"}
                  {focus.project ? (
                    <span className="truncate">· {focus.project.name}</span>
                  ) : null}
                </div>
              </div>
            ) : null}

            <Link href="/my-day" className="mt-4 block">
              <Button className="w-full" size="sm">
                Plan my day
                <ArrowUpRight className="size-3.5" />
              </Button>
            </Link>
          </section>

          <section className="rounded-3xl border border-line bg-surface/40">
            <div className="border-b border-line px-4 py-3">
              <p className="text-sm font-medium">Activity</p>
              <p className="text-[11px] text-faint">Latest workspace changes</p>
            </div>
            <div className="space-y-0.5 p-2">
              {activity.length === 0 ? (
                <p className="px-3 py-6 text-center text-[12px] text-faint">
                  Activity appears here as you work.
                </p>
              ) : (
                activity.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl px-2.5 py-2 transition hover:bg-white/3"
                  >
                    <p className="text-[12px] leading-relaxed text-muted">
                      {activityLabel(item.type, item.actorName, item.data)}
                    </p>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-faint">
                      <span>{relativeTime(item.createdAt)}</span>
                      {item.projectName ? (
                        <>
                          <span className="text-line-strong">·</span>
                          <span className="truncate">{item.projectName}</span>
                        </>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
