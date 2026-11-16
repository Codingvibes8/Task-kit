"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Check, Loader2 } from "lucide-react";

import { toggleTaskComplete } from "@/server/actions/tasks";
import { cn } from "@/lib/utils";
import type { TaskStatus } from "@/lib/constants";

export function TaskCompleteButton({
  taskId,
  status,
  className,
}: {
  taskId: string;
  status: TaskStatus;
  className?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const done = status === "done";

  return (
    <button
      type="button"
      aria-label={done ? "Reopen task" : "Complete task"}
      aria-pressed={done}
      disabled={pending}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        startTransition(async () => {
          const result = await toggleTaskComplete(taskId);
          if (result.ok) router.refresh();
        });
      }}
      className={cn(
        "mt-0.5 grid size-4.5 shrink-0 place-items-center rounded-full border transition",
        done
          ? "border-accent bg-accent text-accent-ink"
          : "border-line-strong text-transparent hover:border-accent/60 hover:text-accent/60",
        className,
      )}
    >
      {pending ? (
        <Loader2 className="size-3 animate-spin text-muted" />
      ) : (
        <Check className="size-3" strokeWidth={3} />
      )}
    </button>
  );
}
