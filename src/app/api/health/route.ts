import { sql } from "drizzle-orm";

import { getDb } from "@/db";
import {
  isClerkConfigured,
  isDatabaseConfigured,
  isDevAuthBypass,
} from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();

  if (!isDatabaseConfigured()) {
    return Response.json(
      {
        status: "setup_required",
        database: false,
        auth: isClerkConfigured(),
        previewAuth: isDevAuthBypass(),
      },
      { status: 200 },
    );
  }

  try {
    const db = getDb();
    await db.execute(sql`select 1`);

    return Response.json({
      status: "ok",
      database: true,
      auth: isClerkConfigured(),
      previewAuth: isDevAuthBypass(),
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json(
      {
        status: "degraded",
        database: false,
        error: error instanceof Error ? error.message : "unknown",
      },
      { status: 503 },
    );
  }
}
