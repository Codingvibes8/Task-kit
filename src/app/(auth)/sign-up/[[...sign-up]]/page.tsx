import { SignUp } from "@clerk/nextjs";

import { SetupNotice } from "@/components/setup-notice";
import { isClerkConfigured } from "@/lib/env";
import { clerkAppearance } from "@/lib/clerk-appearance";

export default function SignUpPage() {
  if (!isClerkConfigured()) {
    return (
      <SetupNotice
        eyebrow="Clerk not connected"
        title="Add your Clerk keys to create an account"
        description="New accounts are created through Clerk. Local preview mode skips identity entirely and is never available in production."
        steps={[
          "Create an application at <code>dashboard.clerk.com</code>.",
          "Add the keys to <code>.env.local</code> and restart the dev server.",
          "Prefer no account? Set <code>DEV_AUTH_BYPASS=true</code> locally.",
        ]}
        code={`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_…
CLERK_SECRET_KEY=sk_test_…`}
      />
    );
  }

  return (
    <SignUp
      appearance={clerkAppearance}
      signInUrl="/sign-in"
      fallbackRedirectUrl="/dashboard"
    />
  );
}
