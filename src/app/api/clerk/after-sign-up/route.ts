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
    
    // For new sign-ups, we always want to redirect to role selection
    // regardless of whether they have a role or not
    console.log("New sign-up, redirecting to role selection");
    return NextResponse.redirect(new URL("/role-selection", req.url));
  } catch (error) {
    console.error("Error in after-sign-up route:", error);
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    
    // Redirect to the role selection page on error
    console.log("Redirecting to role selection page due to error");
    return NextResponse.redirect(new URL("/role-selection", req.url));
  }
}
