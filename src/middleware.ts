import { clerkMiddleware } from "@clerk/nextjs/server";

// This example protects all routes including api/trpc routes
// Please edit this to allow other routes to be public as needed.
// See https://clerk.com/docs/references/nextjs/auth-middleware for more information about configuring your middleware
export default clerkMiddleware({
  publicRoutes: ["/", "/sign-in", "/sign-up"],
  ignoredRoutes: ["/api/trpc/(.*)"],
});

// See https://clerk.com/docs/references/nextjs/auth-middleware#matcher
export const config = {
  matcher: [
    "/((?!.+\\.[\\w]+$|_next).*)", // exclude static files
    "/",                            // include root
    "/(api|trpc)(.*)",             // include API routes
  ],
}; 