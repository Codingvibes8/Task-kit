"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";

import { createTag } from "@/server/actions/projects";

export function CreateTagForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim() || pending) return;

    startTransition(async () => {
      const result = await createTag({ name });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setName("");
      setError(null);
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="mt-3">
      <div className="flex items-center gap-2 rounded-xl border border-line bg-surface-2/60 px-3 py-2">
        <span className="font-mono text-[11px] text-violet">#</span>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="new-tag"
          maxLength={40}
          className="h-6 flex-1 bg-transparent text-[12px] text-ink outline-none placeholder:text-faint"
        />
        <button
          type="submit"
          disabled={!name.trim() || pending}
          className="inline-flex h-6 items-center gap-1 rounded-md bg-accent px-2 font-mono text-[9px] font-medium uppercase tracking-[0.1em] text-accent-ink disabled:opacity-40"
        >
          {pending ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <Plus className="size-3" />
          )}
          Add
        </button>
      </div>
      {error ? <p className="mt-1 text-[11px] text-rose">{error}</p> : null}
    </form>
  );
}
