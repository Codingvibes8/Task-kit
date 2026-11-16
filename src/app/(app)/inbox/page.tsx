import { redirect } from "next/navigation";
import { Inbox } from "lucide-react";

import { NewTaskButton } from "@/components/board/new-task-button";
import { EmptyState, PageHeader } from "@/components/page-header";
import { QuickAddButton } from "@/components/quick-add";
import { TaskRow } from "@/components/tasks/task-row";
import { getInboxTasks } from "@/db/queries/tasks";
import { getSessionUser } from "@/lib/auth";

export const metadata = { title: "Inbox" };

export default async function InboxPage() {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");

  const tasks = await getInboxTasks(user.id);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Capture · triage"
        title="Inbox"
        description="Loose thoughts land here first. Give them a project when they earn one."
        actions={
          <>
            <QuickAddButton className="inline-flex h-9 items-center gap-2 rounded-xl border border-line bg-surface/60 px-3.5 text-[12px] text-muted transition hover:text-ink">
              Capture
            </QuickAddButton>
            <NewTaskButton projectId={null} label="Add to inbox" />
          </>
        }
      />

      <div className="rounded-2xl border border-line bg-surface/30 px-4 py-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
          Inbox tips
        </p>
        <p className="mt-1 text-[12px] text-muted">
          Type <span className="text-violet">#tag</span>,{" "}
          <span className="text-amber">!high</span>, or{" "}
          <span className="text-accent">/project</span> while capturing. The
          parser handles the rest.
        </p>
      </div>

      <div className="space-y-2">
        {tasks.map((task) => (
          <TaskRow key={task.id} task={task} />
        ))}
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          icon={<Inbox className="size-5" />}
          title="Inbox zero"
          description="Nothing unfiled. Quick capture always drops new thoughts here, so the board stays intentional."
          action={<NewTaskButton projectId={null} label="Add to inbox" />}
        />
      ) : null}
    </div>
  );
}
