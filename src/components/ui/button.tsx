import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger";
type Size = "sm" | "md" | "lg" | "icon";

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-accent-ink hover:bg-accent-soft active:translate-y-px shadow-[0_10px_30px_-12px_rgb(214_255_75/0.6)]",
  secondary:
    "bg-surface-3 text-ink ring-1 ring-line-strong hover:bg-surface-2 hover:ring-line-strong",
  ghost: "text-muted hover:text-ink hover:bg-white/5",
  outline:
    "bg-transparent text-ink ring-1 ring-line-strong hover:bg-white/5 hover:ring-line-strong",
  danger:
    "bg-rose/10 text-rose ring-1 ring-rose/25 hover:bg-rose/15 hover:ring-rose/40",
};

const sizes: Record<Size, string> = {
  sm: "h-8 rounded-lg px-3 text-xs gap-1.5",
  md: "h-9.5 rounded-xl px-4 text-sm gap-2",
  lg: "h-11 rounded-xl px-5 text-sm gap-2",
  icon: "size-9 rounded-xl",
};

export type ButtonProps = ComponentProps<"button"> & {
  variant?: Variant;
  size?: Size;
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex select-none items-center justify-center whitespace-nowrap font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
