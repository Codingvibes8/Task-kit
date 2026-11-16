"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  CalendarDays,
  GripVertical,
  ListTree,
  Pencil,
  Repeat2,
} from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { PRIORITY_META, type TaskPriority } from "@/lib/constants";
import type { TaskCardData } from "@/db/queries/tasks";
import { cn, formatDueDate, isOverdue } from "@/lib/utils";

export function TaskCard({
  task,
  onEdit,
  overlay = false,
}: {
  task: TaskCardData;
  onEdit?: () => void;
  overlay?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { status: task.status },
    disabled: overlay,
  });

  const priority = PRIORITY_META[task.priority as TaskPriority];
  const overdue = task.status !== "done" && isOverdue(task.dueDate);
  const progress =
    task.subtaskTotal > 0
      ? Math.round((task.subtaskDone / task.subtaskTotal) * 100)
      : null;

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        "group relative rounded-2xl border border-line bg-surface p-3 shadow-[0_14px_30px_-26px_black] transition",
        isDragging
          ? "z-10 border-accent/40 opacity-60"
          : "hover:border-line-strong hover:bg-surface-2/80",
        overlay && "rotate-1 border-accent/40 shadow-2xl",
      )}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] ring-1 ring-inset",
            priority.chip,
          )}
        >
          <span className={cn("size-1 rounded-full", priority.dot)} />
          {priority.label}
        </span>

        <div className="flex items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
          <button
            type="button"
            aria-label="Edit task"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              onEdit?.();
            }}
            className="rounded-md p-1 text-faint transition hover:bg-white/5 hover:text-ink"
          >
            <Pencil className="size-3" />
          </button>
          <span className="cursor-grab text-faint active:cursor-grabbing">
            <GripVertical className="size-3.5" />
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onEdit?.();
        }}
        className={cn(
          "mt-2 block w-full text-left text-[13px] leading-snug transition hover:text-accent",
          task.status === "done" ? "text-faint line-through" : "text-ink",
        )}
      >
        {task.title}
      </button>

      {task.tags.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1">
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
      ) : null}

      {progress !== null ? (
        <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full rounded-full bg-accent/70"
            style={{ width: `${progress}%` }}
          />
        </div>
      ) : null}

      <div className="mt-2.5 flex items-center gap-2 text-[10px] text-faint">
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
          <Repeat2 className="size-3 text-violet" />
        ) : null}

        <span className="ml-auto">
          {task.assignee ? (
            <Avatar user={task.assignee} size="xs" />
          ) : (
            <span className="inline-block size-4 rounded-full border border-dashed border-line-strong" />
          )}
        </span>
      </div>
    </div>
  );
}
