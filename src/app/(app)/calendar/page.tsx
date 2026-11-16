import Link from "next/link";
import { redirect } from "next/navigation";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { getTasksDueBetween } from "@/db/queries/tasks";
import { getSessionUser } from "@/lib/auth";
import { PRIORITY_META, type TaskPriority } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const metadata = { title: "Calendar" };

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");

  const { month } = await searchParams;
  const base =
    month && /^\d{4}-\d{2}$/.test(month)
      ? new Date(`${month}-01T12:00:00`)
      : new Date();

  const gridStart = startOfWeek(startOfMonth(base), { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(base), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const tasks = await getTasksDueBetween(user.id, gridStart, gridEnd);

  const byDay = new Map<string, typeof tasks>();
  for (const task of tasks) {
    if (!task.dueDate) continue;
    const key = format(new Date(task.dueDate), "yyyy-MM-dd");
    const bucket = byDay.get(key);
    if (bucket) bucket.push(task);
    else byDay.set(key, [task]);
  }

  const previous = format(addMonths(base, -1), "yyyy-MM");
  const next = format(addMonths(base, 1), "yyyy-MM");

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workspace · time"
        title={format(base, "MMMM yyyy")}
        description="Read-only month view over due dates. Drag-to-reschedule and time blocks arrive in Phase 5."
        actions={
          <div className="flex items-center gap-1.5">
            <Link href={`/calendar?month=${previous}`}>
              <Button variant="outline" size="icon" aria-label="Previous month">
                <ChevronLeft className="size-4" />
              </Button>
            </Link>
            <Link href="/calendar">
              <Button variant="outline" size="sm" className="h-9">
                Today
              </Button>
            </Link>
            <Link href={`/calendar?month=${next}`}>
              <Button variant="outline" size="icon" aria-label="Next month">
                <ChevronRight className="size-4" />
              </Button>
            </Link>
          </div>
        }
      />

      <div className="overflow-hidden rounded-3xl border border-line bg-surface/40">
        <div className="grid grid-cols-7 border-b border-line">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label) => (
            <div
              key={label}
              className="px-3 py-2 font-mono text-[9px] uppercase tracking-[0.16em] text-faint"
            >
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const dayTasks = byDay.get(key) ?? [];
            const inMonth = isSameMonth(day, base);

            return (
              <div
                key={key}
                className={cn(
                  "min-h-28 border-b border-r border-line/70 p-2 last:border-r-0",
                  !inMonth && "bg-canvas/40 text-faint",
                )}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "grid size-6 place-items-center rounded-full font-mono text-[10px]",
                      isToday(day)
                        ? "bg-accent text-accent-ink"
                        : inMonth
                          ? "text-muted"
                          : "text-faint",
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  {dayTasks.length > 0 ? (
                    <span className="font-mono text-[9px] text-faint">
                      {dayTasks.length}
                    </span>
                  ) : null}
                </div>

                <div className="mt-1.5 space-y-1">
                  {dayTasks.slice(0, 3).map((task) => (
                    <Link
                      key={task.id}
                      href={`/tasks/${task.id}`}
                      className="flex items-center gap-1.5 rounded-md bg-white/4 px-1.5 py-1 text-[10px] text-muted transition hover:bg-white/8 hover:text-ink"
                    >
                      <span
                        className={cn(
                          "size-1 shrink-0 rounded-full",
                          PRIORITY_META[task.priority as TaskPriority].dot,
                        )}
                      />
                      <span className="truncate">{task.title}</span>
                    </Link>
                  ))}
                  {dayTasks.length > 3 ? (
                    <p className="px-1.5 font-mono text-[9px] text-faint">
                      +{dayTasks.length - 3} more
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
