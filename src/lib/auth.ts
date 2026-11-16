import { auth, currentUser } from "@clerk/nextjs/server";
import { cache } from "react";

import { getUserById, ensureUser } from "@/db/queries/users";
import type { User } from "@/db/schema";
import { DEV_USER, isClerkConfigured, isDatabaseConfigured, isDevAuthBypass } from "@/lib/env";

export const SESSION_COOKIE_HINT = "task-kit-session";

/**
 * Resolve the current workspace user, provisioning a `users` row on first
 * sight. Memoised per request so layout + page + actions share one lookup.
 */
export const getSessionUser = cache(async (): Promise<User | null> => {
  if (!isDatabaseConfigured()) return null;

  if (isDevAuthBypass()) {
    return ensureUser({ ...DEV_USER });
  }

  if (!isClerkConfigured()) return null;

  const { userId } = await auth();
  if (!userId) return null;

  const existing = await getUserById(userId);
  if (existing) return existing;

  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email =
    clerkUser.primaryEmailAddress?.emailAddress ??
    clerkUser.emailAddresses[0]?.emailAddress ??
    `${userId}@clerk.local`;

  const [firstName, ...rest] = (clerkUser.fullName ?? "").split(" ").filter(Boolean);

  return ensureUser({
    id: userId,
    email,
    firstName: firstName ?? clerkUser.firstName ?? null,
    lastName: rest.join(" ") || clerkUser.lastName || null,
    imageUrl: clerkUser.imageUrl || null,
  });
});

export async function getSessionUserId(): Promise<string | null> {
  const user = await getSessionUser();
  return user?.id ?? null;
}
