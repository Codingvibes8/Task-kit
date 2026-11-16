import Link from "next/link";
import { ArrowUpRight, CheckCircle2, Terminal } from "lucide-react";

import { Brand } from "@/components/brand";
import { Badge } from "@/components/ui/badge";

export function SetupNotice({
  eyebrow,
  title,
  description,
  steps,
  code,
}: {
  eyebrow: string;
  title: string;
  description: string;
  steps: string[];
  code?: string;
}) {
  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden px-6 py-16">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 grid-backdrop" />
      <div className="relative w-full max-w-xl">
        <Brand href="/" className="mb-8" />
        <div className="rounded-3xl border border-line-strong bg-surface p-7 shadow-panel sm:p-9">
          <Badge tone="warning">{eyebrow}</Badge>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">
            {title}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>

          <ol className="mt-6 space-y-3">
            {steps.map((step, index) => (
              <li key={step} className="flex items-start gap-3">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-accent/10 font-mono text-[10px] text-accent ring-1 ring-inset ring-accent/25">
                  {index + 1}
                </span>
                <span
                  className="text-[13px] leading-relaxed text-muted"
                  dangerouslySetInnerHTML={{ __html: step }}
                />
              </li>
            ))}
          </ol>

          {code ? (
            <pre className="mt-5 overflow-x-auto rounded-2xl border border-line bg-canvas p-4 font-mono text-[11px] leading-relaxed text-accent/90">
              {code}
            </pre>
          ) : null}

          <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-line pt-5">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-ink transition hover:bg-accent-soft"
            >
              Back to overview
              <ArrowUpRight className="size-3.5" />
            </Link>
            <a
              href="https://neon.tech"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm text-muted transition hover:text-ink"
            >
              <CheckCircle2 className="size-4" />
              Create a Neon database
            </a>
          </div>
        </div>

        <p className="mt-5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
          <Terminal className="size-3.5" />
          Full runbook in README.md and docs/IMPLEMENTATION_PLAN.md
        </p>
      </div>
    </div>
  );
}
