"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter, usePathname } from "next/navigation";

export function AuthRedirect() {
  // Only run on the client side
  if (typeof window === "undefined") return null;

  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    // Only run this effect on the client after auth is loaded
    if (!isLoaded) return;

    try {
      // Check if there's a redirect URL stored in localStorage
      const redirectUrl = localStorage.getItem("redirectAfterAuth");

      // Check if this is an OAuth callback
      const isOAuthCallback = window.location.href.includes("__clerk_cb=");

      // Only redirect if user is signed in and we have a redirect URL
      // and we're not already on a sign-in or sign-up page
      // and we haven't already redirected
      // OR if this is an OAuth callback
      if (
        (isSignedIn &&
          redirectUrl &&
          !pathname.startsWith("/sign-in") &&
          !pathname.startsWith("/sign-up") &&
          !hasRedirected) ||
        isOAuthCallback
      ) {
        // Clear the redirect URL from localStorage
        const finalRedirectUrl = redirectUrl || "/attendee/dashboard";
        localStorage.removeItem("redirectAfterAuth");
        // Mark that we've redirected to prevent loops
        setHasRedirected(true);
        // Redirect the user with a full page reload
        window.location.href = finalRedirectUrl;
      }
    } catch (error) {
      // Handle any localStorage errors silently
      console.error("Error in auth redirect:", error);
    }
  }, [isSignedIn, isLoaded, router, pathname, hasRedirected]);

  // This component doesn't render anything
  return null;
}
