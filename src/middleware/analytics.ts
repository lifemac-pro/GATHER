import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { trackEvent } from "@/lib/analytics";
// Use the server-only import in a way that doesn't trigger the error
import * as ClerkServer from "@clerk/nextjs/server";

/**
 * Middleware to track page views
 */
export async function analyticsMiddleware(
  request: NextRequest,
  response: NextResponse,
) {
  try {
    // Get the user ID from Clerk
    const { userId } = ClerkServer.getAuth(request);

    // Skip tracking for non-authenticated users or API routes
    if (!userId || request.nextUrl.pathname.startsWith("/api/")) {
      return response;
    }

    // Track the page view
    await trackEvent({
      userId,
      eventType: "page_view",
      properties: {
        path: request.nextUrl.pathname,
      },
      request,
    });

    return response;
  } catch (error) {
    console.error("Error in analytics middleware:", error);
    return response;
  }
}

/**
 * Helper function to track specific events
 */
export async function trackUserEvent({
  userId,
  eventType,
  properties = {},
  request,
}: {
  userId: string;
  eventType: string;
  properties?: Record<string, any>;
  request?: Request;
}) {
  try {
    await trackEvent({
      userId,
      eventType,
      properties,
      request,
    });

    return { success: true };
  } catch (error) {
    console.error("Error tracking user event:", error);
    return { success: false, error };
  }
}
