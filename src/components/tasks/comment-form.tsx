"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";

import { addComment } from "@/server/actions/comments";

export function CommentForm({ taskId }: { taskId: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!body.trim() || pending) return;

    startTransition(async () => {
      const result = await addComment({ taskId, body });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setBody("");
      setError(null);
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="mt-4">
      <div className="rounded-2xl border border-line bg-surface-2/50 p-3">
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Leave context for the next person…"
          rows={3}
          maxLength={10000}
          className="w-full resize-y bg-transparent text-[12px] leading-relaxed text-ink outline-none placeholder:text-faint"
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-faint">
            Comments stay on the task
          </span>
          <button
            type="submit"
            disabled={pending || !body.trim()}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-accent px-3 text-[11px] font-medium text-accent-ink transition hover:bg-accent-soft disabled:opacity-50"
          >
            {pending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Send className="size-3.5" />
            )}
            Comment
          </button>
        </div>
      </div>
      {error ? <p className="mt-1 text-[11px] text-rose">{error}</p> : null}
    </form>
  );
}
