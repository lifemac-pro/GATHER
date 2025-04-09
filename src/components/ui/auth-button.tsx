"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "./button";

type AuthButtonProps = {
  mode: "sign-in" | "sign-up";
  redirectUrl: string;
  className?: string;
  children: React.ReactNode;
};

export function AuthButton({
  mode,
  redirectUrl,
  className,
  children,
}: AuthButtonProps) {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // This effect runs only on the client after hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleClick = () => {
    // Only execute client-side logic after component is mounted
    if (!mounted) return;

    if (isSignedIn) {
      // If already signed in, redirect directly with a full page reload
      window.location.href = redirectUrl;
      return;
    }

    // Store the redirect URL for after authentication
    if (typeof window !== "undefined") {
      localStorage.setItem("redirectAfterAuth", redirectUrl);
    }

    try {
      // Redirect to the sign-in or sign-up page with a full page reload
      // Add a special parameter to indicate we want to redirect to oauth-callback
      if (mode === "sign-in") {
        window.location.href = `/sign-in?redirect_url=${encodeURIComponent("/oauth-callback")}`;
      } else {
        window.location.href = `/sign-up?redirect_url=${encodeURIComponent("/oauth-callback")}`;
      }
    } catch (error) {
      // If there's an error with Clerk, just redirect to the dashboard anyway
      console.error("Auth error, redirecting to dashboard", error);
      window.location.href = redirectUrl;
    }
  };

  // During server rendering or before hydration, render a button with the same appearance
  // but without any client-side behavior
  if (!mounted) {
    return <Button className={className}>{children}</Button>;
  }

  // After hydration, render the fully functional button
  return (
    <Button className={className} onClick={handleClick}>
      {isSignedIn && isLoaded ? "Go to Dashboard" : children}
    </Button>
  );
}
