import { NextRequest, NextResponse } from "next/server";
import { getUserRole, getRoleRedirectUrl } from "@/lib/user-role";

export async function GET(req: NextRequest) {
  try {
    // Get the user ID from the query parameters
    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    
    // If no user ID, redirect to the home page
    if (!userId) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    
    // Get the user's role
    const userRole = await getUserRole(userId);
    
    // Get the redirect URL based on the user's role
    const redirectUrl = getRoleRedirectUrl(userRole);
    
    // Redirect to the appropriate page
    return NextResponse.redirect(new URL(redirectUrl, req.url));
  } catch (error) {
    console.error("Error in after-sign-in route:", error);
    
    // Redirect to the home page on error
    return NextResponse.redirect(new URL("/", req.url));
  }
}
