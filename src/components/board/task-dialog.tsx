"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import {
  PRIORITY_META,
  STATUS_META,
  TASK_PRIORITIES,
  TASK_STATUSES,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/constants";
import { cn, toDateTimeLocal } from "@/lib/utils";
import {
  createTask,
  deleteTask,
  updateTask,
} from "@/server/actions/tasks";

export type EditableTask = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date | string | null;
  assigneeId: string | null;
};

export function TaskDialog({
  open,
  onClose,
  projectId,
  task,
  defaultStatus = "todo",
}: {
  open: boolean;
  onClose: () => void;
  projectId?: string | null;
  task?: EditableTask | null;
  defaultStatus?: TaskStatus;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? defaultStatus);
  const [priority, setPriority] = useState<TaskPriority>(
    task?.priority ?? "none",
  );
  const [dueDate, setDueDate] = useState(toDateTimeLocal(task?.dueDate ?? null));

  if (!open) return null;

  function submit() {
    const trimmed = title.trim();
    if (!trimmed) {
      setError("A title is required.");
      return;
    }
    setError(null);

    startTransition(async () => {
      const due = dueDate ? new Date(dueDate).toISOString() : null;
      const result = task
        ? await updateTask({
            id: task.id,
            title: trimmed,
            description: description.trim() || null,
            status,
            priority,
            dueDate: due,
          })
        : await createTask({
            title: trimmed,
            description: description.trim() || null,
            projectId: projectId ?? null,
            status,
            priority,
            dueDate: due,
          });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      onClose();
      router.refresh();
    });
  }

  function remove() {
    if (!task) return;
    if (!window.confirm("Delete this task and its subtasks?")) return;

    startTransition(async () => {
      const result = await deleteTask(task.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onClose();
      if (window.location.pathname.startsWith("/tasks/")) {
        router.push("/tasks");
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 py-10">
      <button
        type="button"
        aria-label="Close dialog"
        className="fixed inset-0 bg-canvas/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg animate-float-in rounded-3xl border border-line-strong bg-surface shadow-[0_40px_120px_-40px_black]">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <p className="text-sm font-semibold">
              {task ? "Edit task" : "New task"}
            </p>
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-faint">
              {task ? "update the source of truth" : "add to the board"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-faint transition hover:bg-white/5 hover:text-ink"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <Field label="Title">
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="What needs to happen?"
              autoFocus
              maxLength={500}
            />
          </Field>

          <Field label="Notes" hint="Markdown-friendly context, links, acceptance criteria.">
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Add detail…"
              rows={3}
              maxLength={20000}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Status">
              <Select
                value={status}
                onChange={(event) => setStatus(event.target.value as TaskStatus)}
              >
                {TASK_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {STATUS_META[value].label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Priority">
              <Select
                value={priority}
                onChange={(event) =>
                  setPriority(event.target.value as TaskPriority)
                }
              >
                {TASK_PRIORITIES.map((value) => (
                  <option key={value} value={value}>
                    {PRIORITY_META[value].label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="Due date" hint="Stored as UTC; rendered in your local timezone.">
            <Input
              type="datetime-local"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
            />
          </Field>

          {error ? (
            <p className="flex items-center gap-1.5 rounded-xl border border-rose/20 bg-rose/5 px-3 py-2 text-[12px] text-rose">
              <AlertCircle className="size-3.5" />
              {error}
            </p>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-line px-5 py-4">
          {task ? (
            <Button
              variant="danger"
              size="sm"
              onClick={remove}
              disabled={pending}
            >
              <Trash2 className="size-3.5" />
              Delete
            </Button>
          ) : (
            <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
              ⌘↵ to save
            </span>
          )}

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={submit}
              disabled={pending}
              className={cn(pending && "opacity-80")}
            >
              {pending ? <Loader2 className="size-3.5 animate-spin" /> : null}
              {task ? "Save changes" : "Create task"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
