/**
 * Environment contract. Keep every `process.env` read here so the rest of the
 * app can ask semantic questions ("is auth configured?") instead of poking at
 * strings.
 */

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function isClerkConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
      process.env.CLERK_SECRET_KEY,
  );
}

/**
 * Local-only preview identity. Never active in production, even if the flag is
 * accidentally set there.
 */
export function isDevAuthBypass(): boolean {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.DEV_AUTH_BYPASS === "true" &&
    !isClerkConfigured()
  );
}

export const DEV_USER = {
  id: "user_dev_preview",
  email: "preview@taskkit.local",
  firstName: "Preview",
  lastName: "User",
  imageUrl: null,
  timezone: "UTC",
} as const;

export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}
