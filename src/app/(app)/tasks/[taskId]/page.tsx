import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  CalendarDays,
  Inbox,
  Link2,
  MessageSquare,
  Repeat2,
  Timer,
  User,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { AddSubtaskForm } from "@/components/tasks/add-subtask-form";
import { CommentForm } from "@/components/tasks/comment-form";
import { MyDayButton } from "@/components/tasks/my-day-button";
import { TaskCompleteButton } from "@/components/tasks/task-complete-button";
import { TaskEditButton } from "@/components/tasks/task-edit-button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getProjectAccess } from "@/db/queries/projects";
import { displayName } from "@/db/queries/users";
import {
  getTaskDetail,
  isTaskInMyDay,
} from "@/db/queries/tasks";
import { getSessionUser } from "@/lib/auth";
import { PRIORITY_META, STATUS_META } from "@/lib/constants";
import {
  formatDateTime,
  relativeTime,
  todayISO,
} from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = await params;
  const task = await getTaskDetail(taskId);
  return { title: task?.title ?? "Task" };
}

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");

  const task = await getTaskDetail(taskId);
  if (!task) notFound();

  let canWrite = task.creatorId === user.id;
  if (task.projectId) {
    const access = await getProjectAccess(task.projectId, user.id);
    if (!access) notFound();
    canWrite = access.role !== "viewer";
  }

  const day = todayISO();
  const inMyDay = await isTaskInMyDay(user.id, task.id, day);
  const statusMeta = STATUS_META[task.status];
  const priorityMeta = PRIORITY_META[task.priority];
  const doneSubtasks = task.subtasks.filter(
    (subtask) => subtask.status === "done",
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <nav className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
          {task.project ? (
            <>
              <Link href="/projects" className="transition hover:text-muted">
                Projects
              </Link>
              <span>/</span>
              <Link
                href={`/projects/${task.project.id}`}
                className="truncate text-muted transition hover:text-ink"
              >
                {task.project.name}
              </Link>
            </>
          ) : (
            <Link
              href="/inbox"
              className="inline-flex items-center gap-1 text-muted transition hover:text-ink"
            >
              <Inbox className="size-3" />
              Inbox
            </Link>
          )}
          <span>/</span>
          <span className="text-faint">task</span>
        </nav>

        <PageHeader
          className="mt-2"
          title={task.title}
          description={task.description ?? undefined}
          actions={
            <>
              {canWrite ? (
                <>
                  <MyDayButton taskId={task.id} day={day} added={inMyDay} />
                  <TaskEditButton
                    projectId={task.projectId}
                    task={{
                      id: task.id,
                      title: task.title,
                      description: task.description,
                      status: task.status,
                      priority: task.priority,
                      dueDate: task.dueDate,
                      assigneeId: task.assigneeId,
                    }}
                  />
                </>
              ) : (
                <Badge tone="warning">read only</Badge>
              )}
            </>
          }
        />

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface/60 px-2.5 py-1 text-[11px]">
            <TaskCompleteButton taskId={task.id} status={task.status} />
            <span className={statusMeta.text}>{statusMeta.label}</span>
          </span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] ring-1 ring-inset ${priorityMeta.chip}`}
          >
            <span className={`size-1.5 rounded-full ${priorityMeta.dot}`} />
            {priorityMeta.label}
          </span>
          {task.dueDate ? (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface/60 px-2.5 py-1 text-[11px] text-muted">
              <CalendarDays className="size-3.5" />
              {formatDateTime(task.dueDate)}
            </span>
          ) : null}
          {task.recurrenceRule ? (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface/60 px-2.5 py-1 text-[11px] text-violet">
              <Repeat2 className="size-3.5" />
              {task.recurrenceRule}
            </span>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-line bg-surface/40 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium">Description</h2>
              <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-faint">
                markdown-ready
              </span>
            </div>
            {task.description ? (
              <p className="mt-3 whitespace-pre-wrap text-[13px] leading-relaxed text-muted">
                {task.description}
              </p>
            ) : (
              <p className="mt-3 text-[12px] italic text-faint">
                No description yet. Edit the task to add context.
              </p>
            )}
          </section>

          <section className="rounded-3xl border border-line bg-surface/40 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium">Subtasks</h2>
              <span className="font-mono text-[10px] text-faint">
                {doneSubtasks}/{task.subtasks.length}
              </span>
            </div>

            <div className="mt-3 space-y-2">
              {task.subtasks.map((subtask) => (
                <div
                  key={subtask.id}
                  className="flex items-center gap-2.5 rounded-xl border border-line bg-surface-2/40 px-3 py-2"
                >
                  <TaskCompleteButton taskId={subtask.id} status={subtask.status} />
                  <Link
                    href={`/tasks/${subtask.id}`}
                    className={`flex-1 text-[12px] transition hover:text-accent ${
                      subtask.status === "done"
                        ? "text-faint line-through"
                        : "text-ink"
                    }`}
                  >
                    {subtask.title}
                  </Link>
                  {subtask.assignee ? (
                    <Avatar user={subtask.assignee} size="xs" />
                  ) : null}
                </div>
              ))}
              {task.subtasks.length === 0 ? (
                <p className="text-[12px] text-faint">
                  Break this down into smaller steps.
                </p>
              ) : null}
            </div>

            {canWrite ? (
              <AddSubtaskForm parentTaskId={task.id} projectId={task.projectId} />
            ) : null}
          </section>

          <section className="rounded-3xl border border-line bg-surface/40 p-5">
            <div className="flex items-center gap-2">
              <MessageSquare className="size-4 text-faint" />
              <h2 className="text-sm font-medium">Comments</h2>
              <span className="font-mono text-[10px] text-faint">
                {task.comments.length}
              </span>
            </div>

            <div className="mt-4 space-y-4">
              {task.comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar user={comment.author} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-[12px] font-medium text-ink">
                        {displayName(comment.author)}
                      </p>
                      <span className="text-[10px] text-faint">
                        {relativeTime(comment.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-[12px] leading-relaxed text-muted">
                      {comment.body}
                    </p>
                  </div>
                </div>
              ))}

              {task.comments.length === 0 ? (
                <p className="text-[12px] text-faint">
                  No comments yet. Keep decisions next to the work.
                </p>
              ) : null}
            </div>

            {canWrite ? <CommentForm taskId={task.id} /> : null}
          </section>
        </div>

        <aside className="space-y-3">
          <section className="rounded-3xl border border-line bg-surface/40 p-5">
            <h2 className="font-mono text-[9px] uppercase tracking-[0.18em] text-faint">
              Details
            </h2>
            <dl className="mt-4 space-y-3 text-[12px]">
              <div className="flex items-center justify-between gap-3">
                <dt className="inline-flex items-center gap-1.5 text-faint">
                  <Link2 className="size-3.5" /> Project
                </dt>
                <dd className="truncate text-muted">
                  {task.project ? (
                    <Link
                      href={`/projects/${task.project.id}`}
                      className="hover:text-accent"
                    >
                      {task.project.name}
                    </Link>
                  ) : (
                    "Inbox"
                  )}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="inline-flex items-center gap-1.5 text-faint">
                  <User className="size-3.5" /> Assignee
                </dt>
                <dd className="inline-flex items-center gap-1.5 text-muted">
                  {task.assignee ? (
                    <>
                      <Avatar user={task.assignee} size="xs" />
                      {displayName(task.assignee)}
                    </>
                  ) : (
                    "Unassigned"
                  )}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="inline-flex items-center gap-1.5 text-faint">
                  <Timer className="size-3.5" /> Estimate
                </dt>
                <dd className="text-muted">
                  {task.estimateMinutes
                    ? `${task.estimateMinutes} min`
                    : "—"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-faint">Created</dt>
                <dd className="text-muted">
                  {formatDateTime(task.createdAt)}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-3xl border border-line bg-surface/40 p-5">
            <h2 className="font-mono text-[9px] uppercase tracking-[0.18em] text-faint">
              Tags
            </h2>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {task.tags.length === 0 ? (
                <p className="text-[12px] text-faint">
                  No tags. Add #tags when capturing.
                </p>
              ) : (
                task.tags.map(({ tag }) => (
                  <span
                    key={tag.id}
                    className="rounded-md bg-white/5 px-2 py-0.5 font-mono text-[10px]"
                    style={{ color: tag.color }}
                  >
                    #{tag.name}
                  </span>
                ))
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-line bg-surface/40 p-5">
            <h2 className="font-mono text-[9px] uppercase tracking-[0.18em] text-faint">
              My Day
            </h2>
            <p className="mt-2 text-[12px] leading-relaxed text-muted">
              {inMyDay
                ? "This task is part of today's plan."
                : "Not planned for today. Add it when it matters."}
            </p>
            <div className="mt-3">
              <MyDayButton taskId={task.id} day={day} added={inMyDay} />
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
