"use client";

import { SignIn, useAuth, useSignIn } from "@clerk/nextjs";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SignInPage() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect_url") || "/attendee/dashboard";
  const { isSignedIn, isLoaded } = useAuth();
  const { isLoaded: isSignInLoaded, setActive } = useSignIn();
  const router = useRouter();

  // Store redirect URL in localStorage for OAuth flow
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("redirectAfterAuth", redirectUrl);
    }
  }, [redirectUrl]);

  // Redirect if already signed in
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      window.location.href = redirectUrl;
    }
  }, [isLoaded, isSignedIn, redirectUrl]);

  // Handle OAuth callback
  useEffect(() => {
    // Check if this is a callback from OAuth
    if (
      isSignInLoaded &&
      isLoaded &&
      window.location.href.includes("__clerk_cb=")
    ) {
      // After OAuth callback, redirect to the dashboard
      window.location.href = redirectUrl;
    }
  }, [isSignInLoaded, isLoaded, redirectUrl]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#072446]">
      <SignIn
        path="/sign-in"
        routing="path"
        signUpUrl="/sign-up"
        redirectUrl={redirectUrl}
        afterSignInUrl={redirectUrl}
      />
    </div>
  );
}
