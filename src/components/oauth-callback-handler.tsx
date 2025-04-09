"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";

export function OAuthCallbackHandler() {
  // Only run on the client side
  if (typeof window === "undefined") return null;

  const { isSignedIn, isLoaded } = useAuth();
  const [hasHandled, setHasHandled] = useState(false);

  useEffect(() => {
    // Only run this effect on the client after auth is loaded
    if (!isLoaded || hasHandled) return;

    // Check if this is an OAuth callback
    const isOAuthCallback = window.location.href.includes("__clerk_cb=");

    if (isOAuthCallback) {
      try {
        // Get the redirect URL from localStorage
        const redirectUrl =
          localStorage.getItem("redirectAfterAuth") || "/attendee/dashboard";

        // Clear the redirect URL from localStorage
        localStorage.removeItem("redirectAfterAuth");

        // Mark that we've handled this callback
        setHasHandled(true);

        // Add a small delay to ensure Clerk has completed processing
        setTimeout(() => {
          // Redirect the user with a full page reload
          window.location.href = redirectUrl;
        }, 500);
      } catch (error) {
        console.error("Error handling OAuth callback:", error);
        // Fallback redirect
        window.location.href = "/attendee/dashboard";
      }
    }
  }, [isLoaded, isSignedIn, hasHandled]);

  // This component doesn't render anything
  return null;
}
