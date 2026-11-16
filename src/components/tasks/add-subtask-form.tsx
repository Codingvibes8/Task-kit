"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";

import { createTask } from "@/server/actions/tasks";

export function AddSubtaskForm({
  parentTaskId,
  projectId,
}: {
  parentTaskId: string;
  projectId: string | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || pending) return;

    startTransition(async () => {
      const result = await createTask({
        title: trimmed,
        parentTaskId,
        projectId: projectId ?? null,
        status: "todo",
        priority: "none",
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setTitle("");
      setError(null);
      inputRef.current?.focus();
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="mt-2">
      <div className="flex items-center gap-2 rounded-xl border border-line bg-surface-2/60 px-3 py-2">
        <Plus className="size-3.5 text-faint" />
        <input
          ref={inputRef}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Add a subtask…"
          maxLength={500}
          className="h-6 flex-1 bg-transparent text-[12px] text-ink outline-none placeholder:text-faint"
        />
        {pending ? (
          <Loader2 className="size-3.5 animate-spin text-faint" />
        ) : (
          <button
            type="submit"
            disabled={!title.trim()}
            className="rounded-md bg-accent px-2 py-0.5 font-mono text-[9px] font-medium uppercase tracking-[0.1em] text-accent-ink disabled:opacity-40"
          >
            Add
          </button>
        )}
      </div>
      {error ? <p className="mt-1 text-[11px] text-rose">{error}</p> : null}
    </form>
  );
}
