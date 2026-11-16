import Link from "next/link";

import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative grid size-8 shrink-0 place-items-center overflow-hidden rounded-[10px] bg-accent text-accent-ink shadow-[0_6px_20px_-8px_rgb(214_255_75/0.9)]",
        className,
      )}
    >
      <span className="absolute left-1.5 top-1.5 h-1.5 w-4 rounded-full bg-current opacity-95" />
      <span className="absolute left-1.5 top-3.5 h-1.5 w-2.5 rounded-full bg-current opacity-75" />
      <span className="absolute bottom-1.5 right-1.5 size-1.5 rounded-full bg-current" />
    </span>
  );
}

export function Brand({
  href = "/",
  compact = false,
  className,
}: {
  href?: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn("group inline-flex items-center gap-2.5", className)}
    >
      <LogoMark />
      {compact ? null : (
        <span className="flex flex-col leading-none">
          <span className="text-[15px] font-semibold tracking-tight text-ink">
            Task-Kit
          </span>
          <span className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.22em] text-faint">
            focus os
          </span>
        </span>
      )}
    </Link>
  );
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded-md border border-line-strong bg-surface-2 px-1.5 font-mono text-[10px] text-muted">
      {children}
    </kbd>
  );
}
