import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { connectToDatabase } from "./src/server/db/";
import { User } from "./src/server/db/models/user";

// Define public routes that don't require authentication
const publicRoutes = [
  "/",
  "/sign-in",
  "/sign-in/(.*)",
  "/sign-up",
  "/sign-up/(.*)",
  "/api/trpc",
  "/api/trpc/(.*)",
  "/events",
  "/events/:id",
  "/api/webhook",
  "/api/webhook/(.*)",
  "/api/admin/force-user-role",
  "/redirect",
  // No longer need role-selection in public routes
];

// This example protects all routes including api/trpc routes
// Please edit this to allow other routes to be public as needed.
// See https://clerk.com/docs/references/nextjs/auth-middleware for more information about configuring your middleware
export default async function middleware(req) {
  // Handle public routes
  if (publicRoutes.includes(req.nextUrl.pathname)) {
    // Special handling for role-selection page
    if (req.nextUrl.pathname === "/role-selection") {
      // Get user ID from auth
      const session = await auth();
      const userId = session?.userId;
      console.log("Middleware - User ID for role-selection:", userId);

      // If user is not signed in, redirect to sign-in
      if (!userId) {
        console.log("Middleware - User not signed in, redirecting to sign-in");
        return NextResponse.redirect(new URL("/sign-in", req.url));
      }
    }

    return NextResponse.next();
  }

  // Get user ID from auth
  const session = await auth();
  const userId = session?.userId;
  console.log("Middleware - User ID:", userId);

  if (!userId) {
    console.log("Middleware - User not signed in, redirecting to sign-in");
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  try {
    console.log("Middleware - Connecting to database...");
    await connectToDatabase();
    console.log("Middleware - Connected to database successfully");

    // Get user's role
    console.log("Middleware - Fetching user with ID:", userId);
    const user = await User.findOne({ id: userId });
    console.log("Middleware - User found:", user ? { id: user.id, role: user.role } : "No user found");

    // We no longer need special handling for role-selection page
    // as we're automatically assigning roles

    if (!user) {
      console.log("Middleware - No user found in database, redirecting to after-sign-in");
      return NextResponse.redirect(new URL(`/api/clerk/after-sign-in?userId=${userId}`, req.url));
    }

    if (!user.role) {
      console.log("Middleware - User found but no role set, redirecting to after-sign-in");
      return NextResponse.redirect(new URL(`/api/clerk/after-sign-in?userId=${userId}`, req.url));
    }

    // FORCE REDIRECT: Always redirect admin routes to attendee dashboard
    if (req.nextUrl.pathname.startsWith("/admin")) {
      console.log("Middleware - FORCE REDIRECT: Always redirecting from admin to attendee dashboard");
      return NextResponse.redirect(new URL("/attendee/dashboard", req.url));
    }

    // No need to check for attendee routes - everyone can access them
    // This ensures admins can also view the attendee dashboard if needed
    if (req.nextUrl.pathname.startsWith("/attendee")) {
      console.log("Middleware - User accessing attendee routes with role:", user.role);
      console.log("Middleware - Attendee access granted");
    }

    // Handle root path redirection - ALWAYS go to redirect page
    if (req.nextUrl.pathname === "/") {
      console.log("Middleware - User at root path with role:", user.role);
      console.log("Middleware - Always redirecting to redirect page");
      return NextResponse.redirect(new URL("/redirect", req.url));
    }

    console.log("Middleware - All checks passed, proceeding with role:", user.role);
    return NextResponse.next();
  } catch (error) {
    console.error("Middleware error:", error);
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });

    // If there's a database connection error, we should still allow access to public routes
    if (req.nextUrl.pathname.startsWith("/events") ||
        req.nextUrl.pathname === "/" ||
        req.nextUrl.pathname.startsWith("/sign-") ||
        req.nextUrl.pathname.includes("/api/") ||
        req.nextUrl.pathname.includes("/_next/") ||
        req.nextUrl.pathname.includes("/_vercel/")) {
      console.log("Middleware - Error occurred but allowing access to public/essential route:", req.nextUrl.pathname);
      return NextResponse.next();
    }

    // If the user is trying to access admin routes but there's a database error,
    // redirect them to the attendee dashboard for safety
    if (req.nextUrl.pathname.startsWith("/admin")) {
      console.log("Middleware - User trying to access admin routes but database error occurred, redirecting to attendee dashboard");
      return NextResponse.redirect(new URL("/attendee/dashboard", req.url));
    }

    // If the user is trying to access a protected route but there's a database error,
    // redirect them to the attendee dashboard as a safe default
    if (userId) {
      console.log("Middleware - User is authenticated but database error occurred, redirecting to attendee dashboard");
      return NextResponse.redirect(new URL("/attendee/dashboard", req.url));
    }

    // For other routes, redirect to sign-in
    console.log("Middleware - Redirecting to sign-in due to error");
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }
}

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
