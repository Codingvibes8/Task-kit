import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { eq } from "drizzle-orm";

import type { NextRequest } from "next/server";

import { getDb } from "@/db";
import { users } from "@/db/schema";
import { ensureUser } from "@/db/queries/users";
import { isDatabaseConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

/**
 * Clerk lifecycle sync. The lazy `getSessionUser()` fallback keeps sign-in
 * working if the webhook is not configured yet; this route keeps deletions and
 * profile renames authoritative.
 */
export async function POST(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return Response.json(
      { error: "DATABASE_URL is not configured" },
      { status: 503 },
    );
  }

  try {
    const event = await verifyWebhook(request, {
      signingSecret:
        process.env.CLERK_WEBHOOK_SECRET ??
        process.env.CLERK_WEBHOOK_SIGNING_SECRET,
    });

    if (event.type === "user.created" || event.type === "user.updated") {
      const data = event.data;
      const primary =
        data.email_addresses.find(
          (email) => email.id === data.primary_email_address_id,
        ) ?? data.email_addresses[0];

      if (!primary) {
        return Response.json({ ok: true, skipped: "no-email" });
      }

      await ensureUser({
        id: data.id,
        email: primary.email_address,
        firstName: data.first_name ?? null,
        lastName: data.last_name ?? null,
        imageUrl: data.image_url ?? null,
      });
    }

    if (event.type === "user.deleted" && event.data.id) {
      const db = getDb();
      await db.delete(users).where(eq(users.id, event.data.id));
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error("[clerk-webhook] verification failed", error);
    return Response.json({ error: "Invalid webhook" }, { status: 400 });
  }
}
