import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

export type Database = NodePgDatabase<typeof schema>;

const globalForDb = globalThis as unknown as {
  __taskkitPool?: Pool;
  __taskkitDb?: Database;
};

/**
 * Lazily created so `next build` (and pages that render setup screens) can run
 * without a database configured. Neon and local Postgres both speak the
 * standard wire protocol, so one driver covers both.
 */
export function getDb(): Database {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and add your Neon connection string.",
    );
  }

  if (!globalForDb.__taskkitPool) {
    const isLocal = /(localhost|127\.0\.0\.1)/.test(connectionString);

    globalForDb.__taskkitPool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
      ssl: isLocal ? undefined : { rejectUnauthorized: false },
    });
  }

  if (!globalForDb.__taskkitDb) {
    globalForDb.__taskkitDb = drizzle(globalForDb.__taskkitPool, { schema });
  }

  return globalForDb.__taskkitDb;
}

export { schema };
