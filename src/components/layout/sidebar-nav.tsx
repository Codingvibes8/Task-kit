"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Inbox,
  LayoutDashboard,
  ListChecks,
  Settings,
  Sun,
} from "lucide-react";

import { cn } from "@/lib/utils";

const primaryNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/my-day", label: "My Day", icon: Sun },
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/tasks", label: "All tasks", icon: ListChecks },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
] as const;

export function SidebarNav({
  projects,
}: {
  projects: Array<{ id: string; name: string; color: string }>;
}) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <nav className="space-y-0.5">
        {primaryNav.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] transition",
                active
                  ? "bg-white/6 text-ink"
                  : "text-muted hover:bg-white/4 hover:text-ink",
              )}
            >
              {active ? (
                <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-accent" />
              ) : null}
              <item.icon
                className={cn(
                  "size-4",
                  active ? "text-accent" : "text-faint group-hover:text-muted",
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-7">
        <div className="mb-2 flex items-center justify-between px-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
            Projects
          </span>
          <Link
            href="/projects"
            className="text-[11px] text-faint transition hover:text-accent"
          >
            All
          </Link>
        </div>
        <div className="space-y-0.5">
          {projects.length === 0 ? (
            <Link
              href="/projects"
              className="block rounded-xl border border-dashed border-line px-3 py-2.5 text-[12px] text-faint transition hover:border-line-strong hover:text-muted"
            >
              + Create your first project
            </Link>
          ) : (
            projects.map((project) => {
              const active = pathname.startsWith(`/projects/${project.id}`);
              return (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] transition",
                    active
                      ? "bg-white/6 text-ink"
                      : "text-muted hover:bg-white/4 hover:text-ink",
                  )}
                >
                  <span
                    className="size-2 shrink-0 rounded-[3px]"
                    style={{ backgroundColor: project.color }}
                  />
                  <span className="truncate">{project.name}</span>
                </Link>
              );
            })
          )}
        </div>
      </div>

      <div className="mt-6 space-y-0.5">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] transition",
            pathname.startsWith("/settings")
              ? "bg-white/6 text-ink"
              : "text-muted hover:bg-white/4 hover:text-ink",
          )}
        >
          <Settings className="size-4 text-faint" />
          Settings
        </Link>
      </div>
    </>
  );
}

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-canvas/95 backdrop-blur lg:hidden">
      <div className="grid grid-cols-5">
        {[
          { href: "/dashboard", label: "Home", icon: LayoutDashboard },
          { href: "/my-day", label: "My Day", icon: Sun },
          { href: "/inbox", label: "Inbox", icon: Inbox },
          { href: "/tasks", label: "Tasks", icon: ListChecks },
          { href: "/calendar", label: "Calendar", icon: CalendarDays },
        ].map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 text-[10px]",
                active ? "text-accent" : "text-faint",
              )}
            >
              <item.icon className="size-4.5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
