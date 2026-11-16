import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";

import { isClerkConfigured } from "@/lib/env";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/projects(.*)",
  "/tasks(.*)",
  "/my-day(.*)",
  "/inbox(.*)",
  "/calendar(.*)",
  "/settings(.*)",
]);

/**
 * Next 16 renamed middleware to proxy. When Clerk is not configured (local
 * scaffolding, CI build), requests fall through to the setup screen instead of
 * crashing the build.
 */
const handler = isClerkConfigured()
  ? clerkMiddleware(async (auth, request) => {
      if (isProtectedRoute(request)) {
        await auth.protect();
      }
    })
  : null;

export default function proxy(request: NextRequest, event: NextFetchEvent) {
  if (!handler) return NextResponse.next();
  return handler(request, event);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
