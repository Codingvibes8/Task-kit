import { UserButton } from "@clerk/nextjs";
import { Search } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

import { Avatar } from "@/components/ui/avatar";
import { Kbd } from "@/components/brand";
import { QuickAddButton } from "@/components/quick-add";
import { isClerkConfigured } from "@/lib/env";
import type { User } from "@/db/schema";
import { displayName } from "@/db/queries/users";

export function Topbar({ user }: { user: User }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas/85 backdrop-blur-xl">
      <div className="flex h-15 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <div className="min-w-0">
          <p className="truncate font-mono text-[9px] uppercase tracking-[0.2em] text-faint">
            {format(new Date(), "EEEE, MMMM d")}
          </p>
          <p className="truncate text-[13px] font-medium text-ink">
            {displayName(user)}
          </p>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/tasks"
            className="hidden h-9 items-center gap-2 rounded-xl border border-line bg-surface/60 px-3 text-[12px] text-faint transition hover:border-line-strong hover:text-muted sm:flex"
          >
            <Search className="size-3.5" />
            <span>Search tasks</span>
            <Kbd>/</Kbd>
          </Link>

          <QuickAddButton className="inline-flex h-9 items-center gap-2 rounded-xl bg-accent px-3 text-[12px] font-medium text-accent-ink transition hover:bg-accent-soft">
            <span className="text-base leading-none">+</span>
            Capture
            <span className="hidden rounded-md border border-black/15 px-1 font-mono text-[9px] sm:inline">
              ⌘K
            </span>
          </QuickAddButton>

          {isClerkConfigured() ? (
            <UserButton
              appearance={{
                elements: { avatarBox: "size-8 ring-1 ring-line" },
              }}
            />
          ) : (
            <span className="inline-flex items-center gap-2 rounded-xl border border-line px-2 py-1">
              <Avatar user={user} size="sm" />
              <span className="hidden text-[11px] text-faint sm:inline">
                Preview
              </span>
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
