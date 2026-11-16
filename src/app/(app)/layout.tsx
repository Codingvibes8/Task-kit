import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { SetupNotice } from "@/components/setup-notice";
import { listProjectsSimple } from "@/db/queries/projects";
import { getSessionUser } from "@/lib/auth";
import {
  isClerkConfigured,
  isDatabaseConfigured,
  isDevAuthBypass,
} from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isDatabaseConfigured()) {
    return (
      <SetupNotice
        eyebrow="Database not connected"
        title="Connect your Neon database"
        description="Task-Kit stores every task, project, and comment in Postgres via Drizzle. The schema and migrations are already in the repo; point the app at a database to continue."
        steps={[
          "Create a project at <code>neon.tech</code> and copy the pooled connection string.",
          "Add it to <code>.env.local</code> as <code>DATABASE_URL</code>.",
          "Run the migration and seed scripts, then restart the dev server.",
        ]}
        code={`DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/taskkit?sslmode=require

npm run db:migrate
npm run db:seed`}
      />
    );
  }

  if (!isClerkConfigured() && !isDevAuthBypass()) {
    return (
      <SetupNotice
        eyebrow="Authentication not connected"
        title="Connect Clerk or enable local preview"
        description="Protected routes redirect to Clerk whenever keys are present. For local development without an account, enable the preview identity (never active in production)."
        steps={[
          "Add <code>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> and <code>CLERK_SECRET_KEY</code> to <code>.env.local</code>.",
          "Or set <code>DEV_AUTH_BYPASS=true</code> for a local-only preview user.",
          "Restart the dev server.",
        ]}
        code={`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_…
CLERK_SECRET_KEY=sk_test_…
# or, local only:
DEV_AUTH_BYPASS=true`}
      />
    );
  }

  const user = await getSessionUser();

  if (!user) {
    if (!isClerkConfigured()) {
      return (
        <SetupNotice
          eyebrow="Authentication not connected"
          title="Sign-in is unavailable"
          description="Clerk is not configured and the local preview identity is disabled."
          steps={[
            "Set <code>DEV_AUTH_BYPASS=true</code> for local development.",
            "Or add your Clerk keys to enable real accounts.",
          ]}
        />
      );
    }
    redirect("/sign-in");
  }

  const projects = await listProjectsSimple(user.id);

  return (
    <AppShell user={user} projects={projects} devBypass={isDevAuthBypass()}>
      {children}
    </AppShell>
  );
}
