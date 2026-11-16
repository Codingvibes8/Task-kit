import Link from "next/link";
import { CalendarDays, ListTree, Repeat2 } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { TaskCompleteButton } from "@/components/tasks/task-complete-button";
import { PRIORITY_META, type TaskPriority } from "@/lib/constants";
import type { TaskCardData } from "@/db/queries/tasks";
import { cn, formatDueDate, isOverdue } from "@/lib/utils";

export type TaskRowTask = TaskCardData & {
  project?: { id: string; name: string; color: string } | null;
  recurrenceRule?: string | null;
};

export function TaskRow({
  task,
  showProject = false,
  className,
}: {
  task: TaskRowTask;
  showProject?: boolean;
  className?: string;
}) {
  const overdue = task.status !== "done" && isOverdue(task.dueDate);
  const priority = PRIORITY_META[task.priority as TaskPriority];

  return (
    <div
      className={cn(
        "group flex items-start gap-3 rounded-2xl border border-line bg-surface/40 p-3 transition hover:border-line-strong hover:bg-surface-2/60",
        className,
      )}
    >
      <TaskCompleteButton taskId={task.id} status={task.status} />

      <div className="min-w-0 flex-1">
        <Link
          href={`/tasks/${task.id}`}
          className={cn(
            "line-clamp-2 text-[13px] leading-snug transition hover:text-accent",
            task.status === "done" ? "text-faint line-through" : "text-ink",
          )}
        >
          {task.title}
        </Link>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] text-faint">
          {showProject && task.project ? (
            <span className="inline-flex items-center gap-1">
              <span
                className="size-1.5 rounded-[2px]"
                style={{ backgroundColor: task.project.color }}
              />
              {task.project.name}
            </span>
          ) : null}

          {task.dueDate ? (
            <span
              className={cn(
                "inline-flex items-center gap-1",
                overdue ? "text-rose" : "text-muted",
              )}
            >
              <CalendarDays className="size-3" />
              {formatDueDate(task.dueDate)}
            </span>
          ) : null}

          {task.subtaskTotal > 0 ? (
            <span className="inline-flex items-center gap-1">
              <ListTree className="size-3" />
              {task.subtaskDone}/{task.subtaskTotal}
            </span>
          ) : null}

          {task.recurrenceRule ? (
            <span className="inline-flex items-center gap-1 text-violet">
              <Repeat2 className="size-3" />
              recurring
            </span>
          ) : null}

          {task.tags.slice(0, 3).map((tag) => (
            <span
              key={tag.id}
              className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[9px]"
              style={{ color: tag.color }}
            >
              #{tag.name}
            </span>
          ))}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {task.priority !== "none" ? (
          <span
            className="hidden items-center gap-1 font-mono text-[9px] uppercase tracking-[0.1em] sm:inline-flex"
            title={`${priority.label} priority`}
          >
            <span className={cn("size-1.5 rounded-full", priority.dot)} />
            <span className="text-faint">{priority.label}</span>
          </span>
        ) : null}
        {task.assignee ? <Avatar user={task.assignee} size="xs" /> : null}
      </div>
    </div>
  );
}
