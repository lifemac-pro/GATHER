"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

/**
 * This is a simple redirect page that always redirects to the attendee dashboard
 * regardless of the user's role or any other factors.
 */
export default function RedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Force redirect to attendee dashboard
    console.log("Forcing redirect to attendee dashboard");
    
    // Use window.location for a hard redirect that bypasses any middleware
    window.location.href = "/attendee/dashboard";
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <LoadingSpinner size="lg" text="Redirecting to dashboard..." />
    </div>
  );
}
