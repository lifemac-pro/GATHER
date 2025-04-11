import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/attendee",
  "/organizer",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/oauth-callback",
  "/api/(.*)",
  "/trpc/(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  // If the user is signed in and trying to access a protected route, allow them through
  if (userId && !isPublicRoute(req)) {
    return NextResponse.next();
  }

  // If the user is not signed in and trying to access a protected route, redirect them to the sign-in page
  if (!userId && !isPublicRoute(req)) {
    return NextResponse.redirect(new URL("/attendee", req.nextUrl));
  }

  // For all other cases, just proceed as normal
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
