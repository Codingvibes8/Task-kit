import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, Sun } from "lucide-react";
import { format } from "date-fns";

import { EmptyState, PageHeader } from "@/components/page-header";
import { QuickAddButton } from "@/components/quick-add";
import { MyDayButton } from "@/components/tasks/my-day-button";
import { TaskRow } from "@/components/tasks/task-row";
import { getMyDayTasks, getMyOpenTasks } from "@/db/queries/tasks";
import { getSessionUser } from "@/lib/auth";
import { todayISO } from "@/lib/utils";

export const metadata = { title: "My Day" };

export default async function MyDayPage() {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");

  const day = todayISO();
  const [planned, openTasks] = await Promise.all([
    getMyDayTasks(user.id, day),
    getMyOpenTasks(user.id, 60),
  ]);

  const plannedIds = new Set(planned.map((task) => task.id));
  const suggestions = openTasks
    .filter((task) => !plannedIds.has(task.id))
    .slice(0, 6);

  const doneCount = planned.filter((task) => task.status === "done").length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={format(new Date(), "EEEE · MMMM d, yyyy")}
        title="My Day"
        description="Choose a small number of things. The rest of the backlog can wait until tomorrow — it will still be there."
        actions={
          <QuickAddButton className="inline-flex h-9 items-center gap-2 rounded-xl bg-accent px-3.5 text-[12px] font-medium text-accent-ink transition hover:bg-accent-soft">
            <Sun className="size-3.5" />
            Capture for today
          </QuickAddButton>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="rounded-3xl border border-line bg-surface/40">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <div>
              <p className="text-sm font-medium">Today&apos;s plan</p>
              <p className="text-[11px] text-faint">
                {planned.length === 0
                  ? "Nothing chosen yet"
                  : `${doneCount}/${planned.length} complete`}
              </p>
            </div>
            {planned.length > 0 ? (
              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-accent transition"
                  style={{
                    width: `${Math.round((doneCount / planned.length) * 100)}%`,
                  }}
                />
              </div>
            ) : null}
          </div>

          <div className="space-y-2 p-3">
            {planned.map((task, index) => (
              <div key={task.id} className="flex items-stretch gap-2">
                <span className="mt-3 w-4 shrink-0 text-right font-mono text-[10px] text-faint">
                  {index + 1}
                </span>
                <TaskRow task={task} showProject className="flex-1" />
                <MyDayButton taskId={task.id} day={day} added />
              </div>
            ))}

            {planned.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
                <div className="grid size-10 place-items-center rounded-2xl bg-accent/10 text-accent">
                  <Sun className="size-4.5" />
                </div>
                <p className="mt-3 text-sm font-medium">
                  What are today&apos;s three things?
                </p>
                <p className="mt-1 max-w-sm text-[12px] leading-relaxed text-faint">
                  Add from the suggestions on the right, or capture something
                  new. My Day never auto-fills — the choice is the point.
                </p>
              </div>
            ) : null}
          </div>
        </section>

        <section className="rounded-3xl border border-line bg-surface/40">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <div>
              <p className="text-sm font-medium">Suggested</p>
              <p className="text-[11px] text-faint">
                Due soon, overdue, or high priority
              </p>
            </div>
            <Link
              href="/tasks"
              className="inline-flex items-center gap-1 text-[11px] text-muted transition hover:text-accent"
            >
              All tasks
              <ArrowUpRight className="size-3" />
            </Link>
          </div>

          <div className="space-y-2 p-3">
            {suggestions.map((task) => (
              <div key={task.id} className="flex items-stretch gap-2">
                <TaskRow task={task} showProject className="flex-1" />
                <MyDayButton taskId={task.id} day={day} added={false} />
              </div>
            ))}

            {suggestions.length === 0 ? (
              <EmptyState
                className="border-0 py-8"
                title="No open work to suggest"
                description="Everything open is already planned. Nice."
              />
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
