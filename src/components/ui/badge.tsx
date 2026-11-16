import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export function Badge({
  className,
  tone = "neutral",
  ...props
}: ComponentProps<"span"> & {
  tone?: "neutral" | "accent" | "danger" | "warning";
}) {
  const tones = {
    neutral: "bg-white/5 text-muted ring-white/10",
    accent: "bg-accent/10 text-accent ring-accent/25",
    danger: "bg-rose/10 text-rose ring-rose/25",
    warning: "bg-amber/10 text-amber ring-amber/25",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
