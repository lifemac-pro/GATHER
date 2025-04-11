"use client";

import { SignUp, useAuth, useSignUp } from "@clerk/nextjs";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SignUpPage() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect_url") ?? "/attendee/dashboard";
  const { isSignedIn, isLoaded } = useAuth();
  const { isLoaded: isSignUpLoaded } = useSignUp();
  // We don't need router here

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
      isSignUpLoaded &&
      isLoaded &&
      window.location.href.includes("__clerk_cb=")
    ) {
      // After OAuth callback, redirect to the dashboard
      window.location.href = redirectUrl;
    }
  }, [isSignUpLoaded, isLoaded, redirectUrl]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#072446]">
      <SignUp
        path="/sign-up"
        routing="path"
        signInUrl="/sign-in"
        redirectUrl={redirectUrl}
        afterSignUpUrl={redirectUrl}
      />
    </div>
  );
}
