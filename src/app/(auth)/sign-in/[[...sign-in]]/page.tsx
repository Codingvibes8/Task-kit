import { SignIn } from "@clerk/nextjs";

import { SetupNotice } from "@/components/setup-notice";
import { isClerkConfigured } from "@/lib/env";
import { clerkAppearance } from "@/lib/clerk-appearance";

export default function SignInPage() {
  if (!isClerkConfigured()) {
    return (
      <SetupNotice
        eyebrow="Clerk not connected"
        title="Add your Clerk keys to sign in"
        description="Task-Kit uses Clerk for identity and session security. Until keys are present, local preview mode can be enabled for development."
        steps={[
          "Create an application at <code>dashboard.clerk.com</code>.",
          "Copy the publishable and secret keys into <code>.env.local</code>.",
          "Restart the dev server. This screen becomes the Clerk sign-in form.",
        ]}
        code={`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_…
CLERK_SECRET_KEY=sk_test_…
# local-only alternative
DEV_AUTH_BYPASS=true`}
      />
    );
  }

  return (
    <SignIn
      appearance={clerkAppearance}
      signUpUrl="/sign-up"
      fallbackRedirectUrl="/dashboard"
    />
  );
}
