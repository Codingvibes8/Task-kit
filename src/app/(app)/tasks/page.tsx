import Link from "next/link";
import { redirect } from "next/navigation";
import { ListChecks } from "lucide-react";

import { NewTaskButton } from "@/components/board/new-task-button";
import { EmptyState, PageHeader } from "@/components/page-header";
import { QuickAddButton } from "@/components/quick-add";
import { TaskRow } from "@/components/tasks/task-row";
import { getTaskStatusCounts, listMyTasks } from "@/db/queries/tasks";
import { getSessionUser } from "@/lib/auth";
import {
  STATUS_META,
  TASK_STATUSES,
  type TaskStatus,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

export const metadata = { title: "All tasks" };

const filters = [
  { key: "all", label: "All" },
  ...TASK_STATUSES.map((status) => ({
    key: status,
    label: STATUS_META[status].label,
  })),
] as const;

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");

  const { status: rawStatus } = await searchParams;
  const status = TASK_STATUSES.includes(rawStatus as TaskStatus)
    ? (rawStatus as TaskStatus)
    : undefined;

  const [tasks, counts] = await Promise.all([
    listMyTasks(user.id, status),
    getTaskStatusCounts(user.id),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workspace · tasks"
        title="All tasks"
        description="Everything assigned to you or created by you, across projects and the Inbox."
        actions={
          <>
            <QuickAddButton className="inline-flex h-9 items-center gap-2 rounded-xl border border-line bg-surface/60 px-3.5 text-[12px] text-muted transition hover:text-ink">
              Capture
            </QuickAddButton>
            <NewTaskButton projectId={null} />
          </>
        }
      />

      <div className="flex flex-wrap gap-1 rounded-xl border border-line bg-surface/50 p-1">
        {filters.map((filter) => {
          const active = filter.key === (status ?? "all");
          const count =
            filter.key === "all"
              ? counts.todo + counts.in_progress + counts.done
              : counts[filter.key as TaskStatus];
          return (
            <Link
              key={filter.key}
              href={
                filter.key === "all" ? "/tasks" : `/tasks?status=${filter.key}`
              }
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] transition",
                active
                  ? "bg-white/6 text-ink"
                  : "text-faint hover:text-muted",
              )}
            >
              {filter.label}
              <span className="font-mono text-[9px] opacity-70">{count}</span>
            </Link>
          );
        })}
      </div>

      <div className="space-y-2">
        {tasks.map((task) => (
          <TaskRow key={task.id} task={task} showProject />
        ))}
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          icon={<ListChecks className="size-5" />}
          title="No tasks in this view"
          description="Capture something with ⌘K, or create a task directly. Completed tasks stay here for reference."
          action={<NewTaskButton projectId={null} />}
        />
      ) : null}
    </div>
  );
}
