import { QuickAddButton, QuickAdd } from "@/components/quick-add";
import { Brand } from "@/components/brand";
import { MobileNav, SidebarNav } from "@/components/layout/sidebar-nav";
import { Topbar } from "@/components/layout/topbar";
import type { User } from "@/db/schema";

export function AppShell({
  user,
  projects,
  devBypass,
  children,
}: {
  user: User;
  projects: Array<{ id: string; name: string; color: string; icon: string }>;
  devBypass: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-surface/40 lg:flex">
        <div className="flex h-15 items-center border-b border-line px-4">
          <Brand href="/dashboard" />
        </div>

        <div className="px-3 pt-4">
          <QuickAddButton className="flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-accent text-[12px] font-semibold text-accent-ink transition hover:bg-accent-soft">
            <span className="text-base leading-none">+</span>
            New task
            <span className="rounded-md border border-black/15 px-1 font-mono text-[9px]">
              ⌘K
            </span>
          </QuickAddButton>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-4">
          <SidebarNav projects={projects} />
        </div>

        <div className="border-t border-line p-3">
          {devBypass ? (
            <div className="rounded-xl border border-amber/20 bg-amber/5 p-2.5">
              <p className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-amber">
                <span className="size-1.5 rounded-full bg-amber" />
                Preview auth
              </p>
              <p className="mt-1 text-[10px] leading-relaxed text-faint">
                DEV_AUTH_BYPASS is on. Clerk takes over as soon as keys exist.
              </p>
            </div>
          ) : (
            <p className="px-2 font-mono text-[9px] uppercase tracking-[0.18em] text-faint">
              Task-Kit · v0.1
            </p>
          )}
        </div>
      </aside>

      <div className="min-w-0 pb-16 lg:pb-0">
        <Topbar user={user} />
        <main className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>

      <QuickAdd />
      <MobileNav />
    </div>
  );
}
