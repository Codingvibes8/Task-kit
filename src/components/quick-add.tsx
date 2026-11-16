"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CornerDownLeft, Loader2, Sparkles, X } from "lucide-react";
import { format } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { Kbd } from "@/components/brand";
import { parseCapture } from "@/lib/nlp";
import { quickAddTask } from "@/server/actions/tasks";
import { cn } from "@/lib/utils";

function openQuickAdd() {
  window.dispatchEvent(new Event("taskkit:quick-add"));
}

export function QuickAddButton({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button type="button" onClick={openQuickAdd} className={className}>
      {children}
    </button>
  );
}

export function QuickAdd() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const onOpen = () => setOpen(true);
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("taskkit:quick-add", onOpen);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("taskkit:quick-add", onOpen);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  useEffect(() => {
    if (open) {
      const timer = window.setTimeout(() => inputRef.current?.focus(), 30);
      return () => window.clearTimeout(timer);
    }
  }, [open]);

  const preview = text.trim() ? parseCapture(text) : null;

  function submit() {
    if (!text.trim() || pending) return;
    setError(null);

    startTransition(async () => {
      const result = await quickAddTask({ text });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setText("");
      setOpen(false);
      router.refresh();
    });
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]">
      <button
        type="button"
        aria-label="Close quick capture"
        className="absolute inset-0 bg-canvas/80 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      <div className="relative w-full max-w-xl animate-float-in">
        <div className="overflow-hidden rounded-3xl border border-line-strong bg-surface shadow-[0_40px_120px_-40px_black]">
          <div className="flex items-center gap-2 border-b border-line px-4 py-3">
            <span className="grid size-8 place-items-center rounded-xl bg-accent/10 text-accent ring-1 ring-inset ring-accent/20">
              <Sparkles className="size-4" />
            </span>
            <input
              ref={inputRef}
              value={text}
              onChange={(event) => setText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  submit();
                }
              }}
              placeholder="Call Sam tomorrow 3pm #work !high"
              className="h-9 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-faint"
              aria-label="Quick capture"
              autoComplete="off"
              spellCheck={false}
            />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg p-1.5 text-faint transition hover:bg-white/5 hover:text-ink"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="px-4 py-3">
            {preview ? (
              <div className="space-y-2">
                <p className="text-[13px] text-ink">
                  <span className="text-faint">Title · </span>
                  {preview.title || "Untitled"}
                </p>
                <div className="flex flex-wrap items-center gap-1.5">
                  {preview.dueDate ? (
                    <Badge tone="accent">
                      {preview.allDay
                        ? format(preview.dueDate, "EEE, MMM d")
                        : format(preview.dueDate, "EEE, MMM d · h:mm a")}
                    </Badge>
                  ) : (
                    <Badge>No date</Badge>
                  )}
                  {preview.priority !== "none" ? (
                    <Badge tone="warning">{preview.priority}</Badge>
                  ) : null}
                  {preview.tagNames.map((tag) => (
                    <Badge key={tag}>#{tag}</Badge>
                  ))}
                  {preview.projectName ? (
                    <Badge tone="accent">/{preview.projectName}</Badge>
                  ) : (
                    <Badge>Inbox</Badge>
                  )}
                  {preview.recurrenceRule ? (
                    <Badge tone="accent">↻ {preview.recurrenceRule}</Badge>
                  ) : null}
                </div>
              </div>
            ) : (
              <p className="text-[12px] leading-relaxed text-faint">
                Dates, times, <span className="text-violet">#tags</span>,{" "}
                <span className="text-amber">!priority</span>, and{" "}
                <span className="text-accent">/project</span> are parsed as you
                type.
              </p>
            )}

            {error ? (
              <p className="mt-3 flex items-center gap-1.5 text-[12px] text-rose">
                <AlertCircle className="size-3.5" />
                {error}
              </p>
            ) : null}
          </div>

          <div className="flex items-center justify-between border-t border-line bg-surface-2/50 px-4 py-2.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
              Capture → Inbox
            </span>
            <button
              type="button"
              onClick={submit}
              disabled={pending || !text.trim()}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-lg bg-accent px-3 text-xs font-medium text-accent-ink transition hover:bg-accent-soft disabled:opacity-50",
              )}
            >
              {pending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <CornerDownLeft className="size-3.5" />
              )}
              Save task
              <Kbd>↵</Kbd>
            </button>
          </div>
        </div>

        <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
          Esc to close · ⌘K to toggle
        </p>
      </div>
    </div>
  );
}
