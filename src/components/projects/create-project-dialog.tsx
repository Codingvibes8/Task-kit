"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { createProject } from "@/server/actions/projects";
import { cn } from "@/lib/utils";

const COLORS = [
  "#d6ff4b",
  "#a18bff",
  "#66c7ff",
  "#ffb45c",
  "#ff7285",
  "#9ef01a",
];

export function CreateProjectDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(COLORS[0]);

  function close() {
    setOpen(false);
    setError(null);
  }

  function submit() {
    if (!name.trim()) {
      setError("Give the project a name.");
      return;
    }

    startTransition(async () => {
      const result = await createProject({
        name,
        description: description.trim() || null,
        color,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setName("");
      setDescription("");
      close();
      router.push(`/projects/${result.data.id}`);
      router.refresh();
    });
  }

  return (
    <>
      <Button size="sm" className="h-9 px-3.5" onClick={() => setOpen(true)}>
        <Plus className="size-3.5" />
        New project
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 py-16">
          <button
            type="button"
            aria-label="Close"
            className="fixed inset-0 bg-canvas/80 backdrop-blur-sm"
            onClick={close}
          />
          <div className="relative w-full max-w-md animate-float-in rounded-3xl border border-line-strong bg-surface shadow-[0_40px_120px_-40px_black]">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <div>
                <p className="text-sm font-semibold">New project</p>
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-faint">
                  a shared container for work
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                className="rounded-lg p-1.5 text-faint hover:bg-white/5 hover:text-ink"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <Field label="Name">
                <Input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Website relaunch"
                  autoFocus
                  maxLength={160}
                />
              </Field>

              <Field label="Description" hint="Optional. What does done look like?">
                <Textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Ship the new marketing site before Q4…"
                  rows={3}
                />
              </Field>

              <div>
                <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-faint">
                  Accent
                </p>
                <div className="flex items-center gap-2">
                  {COLORS.map((value) => (
                    <button
                      key={value}
                      type="button"
                      aria-label={`Use ${value}`}
                      aria-pressed={color === value}
                      onClick={() => setColor(value)}
                      className={cn(
                        "size-7 rounded-lg ring-2 ring-offset-2 ring-offset-surface transition",
                        color === value
                          ? "ring-white/40"
                          : "ring-transparent hover:ring-white/20",
                      )}
                      style={{ backgroundColor: value }}
                    />
                  ))}
                </div>
              </div>

              {error ? (
                <p className="flex items-center gap-1.5 rounded-xl border border-rose/20 bg-rose/5 px-3 py-2 text-[12px] text-rose">
                  <AlertCircle className="size-3.5" />
                  {error}
                </p>
              ) : null}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-4">
              <Button variant="ghost" size="sm" onClick={close}>
                Cancel
              </Button>
              <Button size="sm" onClick={submit} disabled={pending}>
                {pending ? <Loader2 className="size-3.5 animate-spin" /> : null}
                Create project
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
