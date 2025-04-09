"use client";

import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";

export default function OAuthCallbackPage() {
  const { isSignedIn, isLoaded } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;

    try {
      // Get the redirect URL from localStorage
      const redirectUrl = localStorage.getItem("redirectAfterAuth") || "/attendee/dashboard";
      
      // Clear the redirect URL from localStorage
      localStorage.removeItem("redirectAfterAuth");
      
      // Redirect the user with a full page reload
      window.location.href = redirectUrl;
    } catch (error) {
      console.error("Error handling OAuth callback:", error);
      // Fallback redirect
      window.location.href = "/attendee/dashboard";
    }
  }, [isLoaded, isSignedIn]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#072446]">
      <div className="rounded-lg bg-white p-8 shadow-lg">
        <h1 className="mb-4 text-2xl font-bold text-[#072446]">Redirecting...</h1>
        <p className="text-gray-600">Please wait while we redirect you to your dashboard.</p>
      </div>
    </div>
  );
}
