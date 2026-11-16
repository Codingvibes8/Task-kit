import { clsx, type ClassValue } from "clsx";
import { format, formatDistanceToNowStrict, isPast, isToday } from "date-fns";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function initials(
  user: { firstName?: string | null; lastName?: string | null; email?: string } | null,
): string {
  if (!user) return "?";
  const parts = [user.firstName, user.lastName].filter(Boolean) as string[];
  if (parts.length > 0) {
    return parts.map((part) => part[0]?.toUpperCase()).join("").slice(0, 2);
  }
  return (user.email?.[0] ?? "?").toUpperCase();
}

export function formatDueDate(date: Date | string | null): string {
  if (!date) return "";
  const value = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(value.getTime())) return "";
  if (isToday(value)) return "Today";
  return format(value, "MMM d");
}

export function formatDateTime(date: Date | string | null): string {
  if (!date) return "—";
  const value = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(value.getTime())) return "—";
  return format(value, "MMM d, yyyy 'at' h:mm a");
}

export function formatShortDate(date: Date | string | null): string {
  if (!date) return "—";
  const value = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(value.getTime())) return "—";
  return format(value, "MMM d, yyyy");
}

export function relativeTime(date: Date | string | null): string {
  if (!date) return "just now";
  const value = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(value.getTime())) return "just now";
  return formatDistanceToNowStrict(value, { addSuffix: true });
}

export function isOverdue(date: Date | string | null): boolean {
  if (!date) return false;
  const value = typeof date === "string" ? new Date(date) : date;
  return isPast(value) && !isToday(value);
}

export function todayISO(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function toDateTimeLocal(date: Date | string | null): string {
  if (!date) return "";
  const value = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(value.getTime())) return "";
  return format(value, "yyyy-MM-dd'T'HH:mm");
}

export function fromDateTimeLocal(value: string): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function clampText(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}
