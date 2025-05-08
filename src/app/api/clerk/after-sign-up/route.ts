import { NextRequest, NextResponse } from "next/server";
import { getUserRole, getRoleRedirectUrl, setUserRole } from "@/lib/user-role";

export async function GET(req: NextRequest) {
  console.log("after-sign-up route called");

  try {
    // Get the user ID from the query parameters
    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    console.log("User ID from query parameters:", userId);

    // If no user ID, redirect to the home page
    if (!userId) {
      console.log("No user ID found, redirecting to home page");
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Get the user's role
    console.log("Getting user role for userId:", userId);
    const userRole = await getUserRole(userId);
    console.log("User role:", userRole);

    // If user doesn't have a role, automatically assign the attendee role
    if (!userRole) {
      console.log("User has no role, automatically assigning 'user' role");
      const success = await setUserRole(userId, "user");
      console.log("Role assignment result:", success ? "success" : "failed");
    }

    // Get the user's role again after potentially setting it
    const finalRole = await getUserRole(userId) || "user";
    console.log("Final role for redirect:", finalRole);

    // ALWAYS redirect to attendee dashboard for new users
    // This ensures a consistent experience for new sign-ups
    const redirectUrl = "/attendee/dashboard";
    console.log("New user, redirecting to attendee dashboard");

    return NextResponse.redirect(new URL(redirectUrl, req.url));
  } catch (error) {
    console.error("Error in after-sign-up route:", error);
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });

    // Redirect to the attendee dashboard on error (default fallback)
    console.log("Error occurred, redirecting to attendee dashboard");
    return NextResponse.redirect(new URL("/attendee/dashboard", req.url));
  }
}
