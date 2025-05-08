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
  // Include role-selection in public routes to allow redirects
  "/role-selection",
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

    // Special handling for role-selection page
    if (req.nextUrl.pathname === "/role-selection") {
      console.log("Middleware - User accessing role-selection page");

      if (user?.role) {
        // If user already has a role, redirect them to their dashboard
        console.log("Middleware - User already has role:", user.role);
        const redirectUrl = (user.role === "admin" || user.role === "super_admin")
          ? "/admin/dashboard"
          : "/attendee/dashboard";
        console.log("Middleware - Redirecting to:", redirectUrl);
        return NextResponse.redirect(new URL(redirectUrl, req.url));
      }

      // If user has no role yet, allow access to role selection page
      console.log("Middleware - User has no role yet, allowing access to role selection page");
      return NextResponse.next();
    }

    if (!user) {
      console.log("Middleware - No user found in database, redirecting to role selection");
      return NextResponse.redirect(new URL("/role-selection", req.url));
    }

    if (!user.role) {
      console.log("Middleware - User found but no role set, redirecting to role selection");
      return NextResponse.redirect(new URL("/role-selection", req.url));
    }

    // Check if user is trying to access admin routes
    if (req.nextUrl.pathname.startsWith("/admin")) {
      console.log("Middleware - User trying to access admin routes with role:", user.role);
      if (user.role !== "admin" && user.role !== "super_admin") {
        console.log("Middleware - Non-admin trying to access admin routes, redirecting to attendee dashboard");
        return NextResponse.redirect(new URL("/attendee/dashboard", req.url));
      }
      console.log("Middleware - Admin access granted");
    }

    // Check if user is trying to access attendee routes
    if (req.nextUrl.pathname.startsWith("/attendee")) {
      console.log("Middleware - User trying to access attendee routes with role:", user.role);
      if (user.role !== "user" && user.role !== "attendee") {
        console.log("Middleware - Non-attendee trying to access attendee routes, redirecting to admin dashboard");
        return NextResponse.redirect(new URL("/admin/dashboard", req.url));
      }
      console.log("Middleware - Attendee access granted");
    }

    // Handle root path redirection based on role
    if (req.nextUrl.pathname === "/") {
      console.log("Middleware - User at root path with role:", user.role);
      if (user.role === "user" || user.role === "attendee") {
        console.log("Middleware - User role is attendee, redirecting to attendee dashboard");
        return NextResponse.redirect(new URL("/attendee/dashboard", req.url));
      } else if (user.role === "admin" || user.role === "super_admin") {
        console.log("Middleware - User role is admin, redirecting to admin dashboard");
        return NextResponse.redirect(new URL("/admin/dashboard", req.url));
      } else {
        console.log("Middleware - Unknown role, redirecting to role selection");
        return NextResponse.redirect(new URL("/role-selection", req.url));
      }
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
    // and essential routes like role selection
    if (req.nextUrl.pathname.startsWith("/events") ||
        req.nextUrl.pathname === "/" ||
        req.nextUrl.pathname.startsWith("/sign-") ||
        req.nextUrl.pathname === "/role-selection" ||
        req.nextUrl.pathname.includes("/api/") ||
        req.nextUrl.pathname.includes("/_next/") ||
        req.nextUrl.pathname.includes("/_vercel/")) {
      console.log("Middleware - Error occurred but allowing access to public/essential route:", req.nextUrl.pathname);
      return NextResponse.next();
    }

    // If the user is trying to access a protected route but there's a database error,
    // redirect them to the role selection page
    if (userId) {
      console.log("Middleware - User is authenticated but database error occurred, redirecting to role selection");
      return NextResponse.redirect(new URL("/role-selection", req.url));
    }

    // For other routes, redirect to role selection
    console.log("Middleware - Redirecting to role selection due to error");
    return NextResponse.redirect(new URL("/role-selection", req.url));
  }
}

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
