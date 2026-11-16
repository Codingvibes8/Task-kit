import { eq } from "drizzle-orm";

import { getDb } from "../index";
import { users, type NewUser, type User } from "../schema";

export async function getUserById(id: string): Promise<User | null> {
  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return user ?? null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const db = getDb();
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);
  return user ?? null;
}

/**
 * Idempotent upsert used by the Clerk webhook and by the lazy session fallback.
 * Keeping profile fields fresh here means a rename in Clerk lands on the next
 * request instead of waiting for a webhook.
 */
export async function ensureUser(input: NewUser): Promise<User> {
  const db = getDb();

  const [user] = await db
    .insert(users)
    .values({ ...input, email: input.email.toLowerCase() })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        email: input.email.toLowerCase(),
        firstName: input.firstName ?? null,
        lastName: input.lastName ?? null,
        imageUrl: input.imageUrl ?? null,
        timezone: input.timezone ?? "UTC",
        updatedAt: new Date(),
      },
    })
    .returning();

  if (!user) {
    throw new Error("Failed to provision user");
  }

  return user;
}

export function displayName(
  user: Pick<User, "firstName" | "lastName" | "email"> | null | undefined,
): string {
  if (!user) return "Unassigned";
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ");
  return name || user.email;
}
