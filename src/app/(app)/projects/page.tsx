import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, FolderKanban } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { Badge } from "@/components/ui/badge";
import { listProjectsForUser } from "@/db/queries/projects";
import { getSessionUser } from "@/lib/auth";

export const metadata = { title: "Projects" };

const roleTone = {
  owner: "accent",
  admin: "accent",
  member: "neutral",
  viewer: "warning",
} as const;

export default async function ProjectsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");

  const projects = await listProjectsForUser(user.id);

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Workspace · projects"
        title="Projects"
        description="Group related work, track momentum, and keep the board honest."
        actions={<CreateProjectDialog />}
      />

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-line px-6 py-20 text-center">
          <div className="grid size-12 place-items-center rounded-2xl bg-accent/10 text-accent">
            <FolderKanban className="size-5" />
          </div>
          <p className="mt-4 text-sm font-medium">No projects yet</p>
          <p className="mt-1.5 max-w-sm text-[12px] leading-relaxed text-faint">
            A project is a board, a list, and a calendar over the same tasks.
            Create one, or keep capturing into the Inbox.
          </p>
          <div className="mt-5">
            <CreateProjectDialog />
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => {
            const progress =
              project.taskCount === 0
                ? 0
                : Math.round((project.doneCount / project.taskCount) * 100);

            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="group relative overflow-hidden rounded-3xl border border-line bg-surface/50 p-5 transition hover:border-line-strong hover:bg-surface"
              >
                <div
                  className="absolute inset-x-0 top-0 h-0.5 opacity-70"
                  style={{ backgroundColor: project.color }}
                />
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="size-2.5 rounded-[3px]"
                      style={{ backgroundColor: project.color }}
                    />
                    <div>
                      <p className="text-[14px] font-medium tracking-tight">
                        {project.name}
                      </p>
                      <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-faint">
                        {project.taskCount} tasks · {project.doneCount} done
                      </p>
                    </div>
                  </div>
                  <Badge tone={roleTone[project.role]}>{project.role}</Badge>
                </div>

                {project.description ? (
                  <p className="mt-4 line-clamp-2 text-[12px] leading-relaxed text-muted">
                    {project.description}
                  </p>
                ) : (
                  <p className="mt-4 text-[12px] italic text-faint">
                    No description yet.
                  </p>
                )}

                <div className="mt-5">
                  <div className="flex items-center justify-between text-[10px] text-faint">
                    <span>{progress}% complete</span>
                    <ArrowUpRight className="size-3.5 transition group-hover:text-accent" />
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full transition"
                      style={{
                        width: `${progress}%`,
                        backgroundColor: project.color,
                      }}
                    />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
