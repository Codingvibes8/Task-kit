import { redirect } from "next/navigation";
import { Check, Database, KeyRound, UserRound } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { CreateTagForm } from "@/components/settings/create-tag-form";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { listTags } from "@/db/queries/projects";
import { displayName } from "@/db/queries/users";
import { getSessionUser } from "@/lib/auth";
import {
  isClerkConfigured,
  isDatabaseConfigured,
  isDevAuthBypass,
} from "@/lib/env";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");

  const tags = await listTags(user.id);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workspace · settings"
        title="Settings"
        description="Identity, tags, and the services this workspace runs on."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-3xl border border-line bg-surface/40 p-5">
          <div className="flex items-center gap-2">
            <UserRound className="size-4 text-faint" />
            <h2 className="text-sm font-medium">Profile</h2>
          </div>

          <div className="mt-5 flex items-center gap-4">
            <Avatar user={user} size="md" className="size-12 text-sm" />
            <div>
              <p className="text-[14px] font-medium">{displayName(user)}</p>
              <p className="text-[12px] text-faint">{user.email}</p>
              <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.14em] text-faint">
                id · {user.id}
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-line bg-canvas/40 p-3 text-[11px] leading-relaxed text-faint">
            Profile fields sync from Clerk. In local preview mode, the seeded
            identity is used instead.
          </div>
        </section>

        <section className="rounded-3xl border border-line bg-surface/40 p-5">
          <div className="flex items-center gap-2">
            <Database className="size-4 text-faint" />
            <h2 className="text-sm font-medium">Environment</h2>
          </div>

          <ul className="mt-4 space-y-2.5 text-[12px]">
            {[
              {
                label: "Postgres / Drizzle",
                ok: isDatabaseConfigured(),
                detail: isDatabaseConfigured()
                  ? "Pooled connection configured"
                  : "DATABASE_URL missing",
                icon: Database,
              },
              {
                label: "Clerk authentication",
                ok: isClerkConfigured(),
                detail: isClerkConfigured()
                  ? "Routes protected by proxy.ts"
                  : "Keys missing",
                icon: KeyRound,
              },
              {
                label: "Preview auth",
                ok: isDevAuthBypass(),
                detail: isDevAuthBypass()
                  ? "Local bypass active (not production)"
                  : "Disabled",
                icon: UserRound,
              },
            ].map((row) => (
              <li
                key={row.label}
                className="flex items-start justify-between gap-3 rounded-xl border border-line bg-canvas/30 px-3 py-2.5"
              >
                <span className="inline-flex items-center gap-2 text-muted">
                  <row.icon className="size-3.5 text-faint" />
                  <span>
                    <span className="block text-ink">{row.label}</span>
                    <span className="text-[10px] text-faint">{row.detail}</span>
                  </span>
                </span>
                <Badge tone={row.ok ? "accent" : "warning"}>
                  {row.ok ? <Check className="size-3" /> : null}
                  {row.ok ? "on" : "off"}
                </Badge>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-3xl border border-line bg-surface/40 p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-medium">Tags</h2>
              <p className="text-[11px] text-faint">
                Workspace-wide labels for context switching.
              </p>
            </div>
            <Badge>{tags.length}</Badge>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag.id}
                className="rounded-lg border border-line bg-surface-2 px-2.5 py-1 font-mono text-[11px]"
                style={{ color: tag.color }}
              >
                #{tag.name}
              </span>
            ))}
            {tags.length === 0 ? (
              <p className="text-[12px] text-faint">
                No tags yet. Type #work while capturing, or add one here.
              </p>
            ) : null}
          </div>

          <div className="max-w-xs">
            <CreateTagForm />
          </div>
        </section>
      </div>
    </div>
  );
}
