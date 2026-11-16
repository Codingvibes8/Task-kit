import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  CalendarDays,
  LayoutGrid,
  ListChecks,
  Lock,
  Users,
} from "lucide-react";

import { KanbanBoard } from "@/components/board/kanban-board";
import { NewTaskButton } from "@/components/board/new-task-button";
import { PageHeader } from "@/components/page-header";
import { TaskRow } from "@/components/tasks/task-row";
import { Badge } from "@/components/ui/badge";
import { getBoardData } from "@/db/queries/tasks";
import { getProjectAccess, listProjectMembers } from "@/db/queries/projects";
import { getSessionUser } from "@/lib/auth";
import { STATUS_META, TASK_STATUSES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const user = await getSessionUser();
  if (!user) return { title: "Project" };
  const access = await getProjectAccess(projectId, user.id);
  return { title: access?.project.name ?? "Project" };
}

const views = [
  { key: "board", label: "Board", icon: LayoutGrid },
  { key: "list", label: "List", icon: ListChecks },
  { key: "calendar", label: "Calendar", icon: CalendarDays },
] as const;

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const { projectId } = await params;
  const { view: rawView } = await searchParams;
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");

  const access = await getProjectAccess(projectId, user.id);
  if (!access) notFound();

  const view =
    rawView === "list" || rawView === "calendar" ? rawView : "board";

  const [board, members] = await Promise.all([
    getBoardData(projectId),
    listProjectMembers(projectId),
  ]);

  const canWrite = access.role !== "viewer";
  const openCount = board.tasks.filter((task) => task.status !== "done").length;

  return (
    <div className="space-y-6">
      <div>
        <nav className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
          <Link href="/projects" className="transition hover:text-muted">
            Projects
          </Link>
          <span>/</span>
          <span className="truncate text-muted">{access.project.name}</span>
        </nav>

        <PageHeader
          className="mt-2"
          title={access.project.name}
          description={
            access.project.description ??
            "No description yet. Add one from project settings."
          }
          actions={
            <>
              <Badge
                tone={access.role === "viewer" ? "warning" : "accent"}
                className="h-7 px-2.5"
              >
                {access.role === "viewer" ? (
                  <Lock className="size-3" />
                ) : (
                  <Users className="size-3" />
                )}
                {access.role}
              </Badge>
              {canWrite ? <NewTaskButton projectId={projectId} /> : null}
            </>
          }
        />

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <div className="flex rounded-xl border border-line bg-surface/60 p-1">
            {views.map((tab) => (
              <Link
                key={tab.key}
                href={`/projects/${projectId}?view=${tab.key}`}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] transition",
                  view === tab.key
                    ? "bg-white/6 text-ink"
                    : "text-faint hover:text-muted",
                )}
              >
                <tab.icon className="size-3.5" />
                {tab.label}
              </Link>
            ))}
          </div>

          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
            {board.tasks.length} tasks · {openCount} open · {members.length}{" "}
            {members.length === 1 ? "member" : "members"}
          </span>
        </div>
      </div>

      {view === "board" ? (
        <KanbanBoard
          key={board.tasks
            .map(
              (task) =>
                `${task.id}:${task.status}:${task.position}:${task.updatedAt}:${task.title}`,
            )
            .join("|")}
          projectId={projectId}
          initialTasks={board.tasks}
          canWrite={canWrite}
        />
      ) : null}

      {view === "list" ? (
        <div className="space-y-6">
          {TASK_STATUSES.map((status) => {
            const tasks = board.tasks
              .filter((task) => task.status === status)
              .sort((a, b) => a.position - b.position);

            return (
              <section key={status}>
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className={cn("size-1.5 rounded-full", STATUS_META[status].dot)}
                  />
                  <h2 className="text-[12px] font-medium">
                    {STATUS_META[status].label}
                  </h2>
                  <span className="font-mono text-[10px] text-faint">
                    {tasks.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {tasks.map((task) => (
                    <TaskRow key={task.id} task={task} />
                  ))}
                  {tasks.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-line px-3 py-5 text-center text-[11px] text-faint">
                      Nothing here.
                    </p>
                  ) : null}
                </div>
              </section>
            );
          })}
        </div>
      ) : null}

      {view === "calendar" ? (
        <div className="rounded-3xl border border-dashed border-line px-6 py-16 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent">
            Phase 5
          </p>
          <p className="mt-2 text-sm font-medium">Time blocking is next</p>
          <p className="mx-auto mt-1.5 max-w-md text-[12px] leading-relaxed text-faint">
            The project calendar will share the same due dates as the board.
            Until then, use the workspace calendar for a read-only month view.
          </p>
          <Link
            href="/calendar"
            className="mt-4 inline-block text-[12px] text-accent hover:underline"
          >
            Open workspace calendar →
          </Link>
        </div>
      ) : null}
    </div>
  );
}
