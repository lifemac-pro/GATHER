"use client";

import { useEffect } from "react";
import { useAuth, useSignIn, useSignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export function useAuthRedirect() {
  const { isSignedIn, isLoaded } = useAuth();
  const { isLoaded: isSignInLoaded } = useSignIn();
  const { isLoaded: isSignUpLoaded } = useSignUp();
  const router = useRouter();

  useEffect(() => {
    // Only run this effect when auth is loaded and user is signed in
    if (isLoaded && isSignedIn && isSignInLoaded && isSignUpLoaded) {
      // Check if there's a redirect URL stored in localStorage
      const redirectUrl = localStorage.getItem("redirectAfterAuth");
      if (redirectUrl) {
        // Clear the redirect URL from localStorage
        localStorage.removeItem("redirectAfterAuth");
        // Redirect the user
        router.push(redirectUrl);
      }
    }
  }, [isSignedIn, isLoaded, isSignInLoaded, isSignUpLoaded, router]);

  // This function can be called from components to set up a redirect
  const prepareRedirect = (redirectUrl: string) => {
    if (isSignedIn) {
      // If already signed in, redirect immediately
      router.push(redirectUrl);
    } else {
      // Otherwise, store the URL for after authentication
      localStorage.setItem("redirectAfterAuth", redirectUrl);
    }
  };

  return { prepareRedirect };
}
