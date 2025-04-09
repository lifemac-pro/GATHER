"use client";

import { useState, useEffect } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { TRPCReactProvider } from "@/trpc/react";
import { Toaster } from "@/components/ui/toaster";
import { AuthRedirect } from "@/components/auth-redirect";
import { OAuthCallbackHandler } from "@/components/oauth-callback-handler";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { NotificationProvider } from "@/context/notification-context";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  // This effect runs only on the client after hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <ClerkProvider
      appearance={{
        elements: {
          // Make sure Clerk components match your app's design
          formButtonPrimary: "bg-[#E1A913] hover:bg-[#c99711] text-[#072446]",
          card: "bg-white shadow-md rounded-lg",
        },
      }}
      // Handle OAuth redirects
      afterSignInUrl="/attendee/dashboard"
      afterSignUpUrl="/attendee/dashboard"
    >
      <ErrorBoundary>
        <TRPCReactProvider>
          <NotificationProvider>
            {children}
            <Toaster />
            {mounted && <AuthRedirect />}
            {mounted && <OAuthCallbackHandler />}
          </NotificationProvider>
        </TRPCReactProvider>
      </ErrorBoundary>
    </ClerkProvider>
  );
}
