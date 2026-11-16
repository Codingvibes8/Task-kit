import { Brand } from "@/components/brand";
import { isClerkConfigured } from "@/lib/env";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  if (!isClerkConfigured()) {
    return <div className="min-h-dvh">{children}</div>;
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_0.95fr]">
      <div className="relative hidden overflow-hidden border-r border-line bg-surface/40 lg:flex lg:flex-col lg:justify-between lg:p-10">
        <div className="pointer-events-none absolute inset-0 dot-backdrop opacity-60" />
        <Brand href="/" className="relative" />

        <div className="relative max-w-md">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent">
            The focus operating system
          </p>
          <h2 className="mt-4 text-balance text-4xl font-semibold leading-[1.08] tracking-[-0.035em]">
            A task manager that gets out of the way.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Capture in seconds, choose what matters today, and finish with a
            board that tells the truth.
          </p>

          <div className="mt-10 space-y-3">
            {[
              ["01", "Keyboard-first capture with local NLP"],
              ["02", "Kanban, list, calendar, and My Day"],
              ["03", "Secured by Clerk · stored in Neon"],
            ].map(([index, label]) => (
              <div
                key={index}
                className="flex items-center gap-4 rounded-2xl border border-line bg-surface/70 px-4 py-3"
              >
                <span className="font-mono text-[10px] text-accent">{index}</span>
                <span className="text-[13px] text-muted">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
          Task-Kit · personal workspace
        </p>
      </div>

      <div className="flex min-h-dvh items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex justify-center lg:hidden">
            <Brand href="/" />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
