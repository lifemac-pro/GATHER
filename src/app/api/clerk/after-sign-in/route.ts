import { NextRequest, NextResponse } from "next/server";
import { getUserRole, getRoleRedirectUrl, setUserRole } from "@/lib/user-role";

export async function GET(req: NextRequest) {
  console.log("after-sign-in route called");

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

    // Always ensure the user has the attendee role
    // If they're an admin, this won't change their role due to the check in setUserRole
    console.log("Ensuring user has the 'user' role");
    try {
      const roleSet = await setUserRole(userId, "user");
      console.log("Role set/check result:", roleSet);
    } catch (roleError) {
      console.error("Error setting/checking role:", roleError);
      // Continue with the flow even if setting the role fails
    }

    // Get the user's role again after potentially setting it
    const finalRole = await getUserRole(userId) || "user";
    console.log("Final role for redirect:", finalRole);

    // ALWAYS redirect to attendee dashboard unless explicitly an admin
    let redirectUrl = "/attendee/dashboard";

    // Only admins go to admin dashboard
    if (finalRole === "admin" || finalRole === "super_admin") {
      redirectUrl = "/admin/dashboard";
      console.log("Admin role detected, redirecting to admin dashboard");
    } else {
      console.log("Non-admin role detected, redirecting to attendee dashboard");
    }

    console.log("Redirecting to:", redirectUrl);

    // Redirect to the appropriate page
    return NextResponse.redirect(new URL(redirectUrl, req.url));
  } catch (error) {
    console.error("Error in after-sign-in route:", error);
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
