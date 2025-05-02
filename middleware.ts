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
  "/role-selection",
];

// This example protects all routes including api/trpc routes
// Please edit this to allow other routes to be public as needed.
// See https://clerk.com/docs/references/nextjs/auth-middleware for more information about configuring your middleware
export default async function middleware(req) {
  // Handle public routes
  if (publicRoutes.includes(req.nextUrl.pathname)) {
    return NextResponse.next();
  }

  // Get user ID from auth
  const session = await auth();
  const userId = session?.userId;
  console.log("Middleware - User ID:", userId);

  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  try {
    await connectToDatabase();
    console.log("Middleware - Connected to database");

    // Get user's role
    const user = await User.findOne({ id: userId });
    console.log("Middleware - User found:", user);

    // Special handling for role-selection page
    if (req.nextUrl.pathname === "/role-selection") {
      if (user?.role) {
        // If user already has a role, redirect them to their dashboard
        console.log("Middleware - User already has role, redirecting to dashboard");
        const redirectUrl = user.role === "admin" ? "/admin/dashboard" : "/attendee/dashboard";
        return NextResponse.redirect(new URL(redirectUrl, req.url));
      }
      return NextResponse.next();
    }

    if (!user || !user.role) {
      console.log("Middleware - No role found, redirecting to role selection");
      return NextResponse.redirect(new URL("/role-selection", req.url));
    }

    // Check if user is trying to access admin routes
    if (req.nextUrl.pathname.startsWith("/admin")) {
      if (user.role !== "admin") {
        console.log("Middleware - Non-admin trying to access admin routes, redirecting to attendee dashboard");
        return NextResponse.redirect(new URL("/attendee/dashboard", req.url));
      }
    }

    // Check if user is trying to access attendee routes
    if (req.nextUrl.pathname.startsWith("/attendee")) {
      if (user.role !== "user") {
        console.log("Middleware - Non-attendee trying to access attendee routes, redirecting to admin dashboard");
        return NextResponse.redirect(new URL("/admin/dashboard", req.url));
      }
    }

    // Handle root path redirection based on role
    if (req.nextUrl.pathname === "/") {
      if (user.role === "user") {
        console.log("Middleware - User role is 'user', redirecting to attendee dashboard");
        return NextResponse.redirect(new URL("/attendee/dashboard", req.url));
      } else if (user.role === "admin") {
        console.log("Middleware - User role is admin, redirecting to admin dashboard");
        return NextResponse.redirect(new URL("/admin/dashboard", req.url));
      }
    }

    console.log("Middleware - All checks passed, proceeding with role:", user.role);
    return NextResponse.next();
  } catch (error) {
    console.error("Middleware error:", error);
    return NextResponse.redirect(new URL("/role-selection", req.url));
  }
}

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
