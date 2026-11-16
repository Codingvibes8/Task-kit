"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Loader2, Plus, X } from "lucide-react";

import {
  addToMyDay,
  removeFromMyDay,
} from "@/server/actions/tasks";
import { cn } from "@/lib/utils";

export function MyDayButton({
  taskId,
  day,
  added,
  className,
}: {
  taskId: string;
  day: string;
  added: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      aria-label={added ? "Remove from My Day" : "Add to My Day"}
      title={added ? "Remove from My Day" : "Add to My Day"}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = added
            ? await removeFromMyDay({ taskId, day })
            : await addToMyDay({ taskId, day });
          if (result.ok) router.refresh();
        })
      }
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-xl border transition",
        added
          ? "border-line text-faint hover:border-rose/40 hover:text-rose"
          : "border-line text-muted hover:border-accent/40 hover:text-accent",
        className,
      )}
    >
      {pending ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : added ? (
        <X className="size-3.5" />
      ) : (
        <Plus className="size-3.5" />
      )}
    </button>
  );
}
