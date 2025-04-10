"use client";

import React, { useState, useEffect } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { TRPCReactProvider } from "@/trpc/react";
import { Toaster } from "@/components/ui/toaster";
import { AuthRedirect } from "@/components/auth-redirect";
import { OAuthCallbackHandler } from "@/components/oauth-callback-handler";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { NotificationProvider } from "@/context/notification-context";
import { EventProvider } from "@/context/event-context";

// Client-side only component
function ClientOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted ? <>{children}</> : null;
}

export function ClientProviders({ children }: { children: React.ReactNode }) {
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
            <EventProvider>
              {children}
              <Toaster />
              <ClientOnly>
                <AuthRedirect />
                <OAuthCallbackHandler />
              </ClientOnly>
            </EventProvider>
          </NotificationProvider>
        </TRPCReactProvider>
      </ErrorBoundary>
    </ClerkProvider>
  );
}
