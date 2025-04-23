"use client";

import { GeistSans } from "geist/font/sans";
import { Toaster } from "sonner";
import { Navbar } from "@/components/ui/navbar";
import { ClerkProvider } from "@clerk/nextjs";
import { TRPCReactProvider } from "@/trpc/react";
import { Sidebar } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { ErrorBoundary } from "@/components/error-boundary";
import { InstallPWAPrompt } from "@/components/pwa/install-prompt";
import { OfflineIndicator } from "@/components/pwa/offline-indicator";
import { useEffect } from "react";
import { registerServiceWorker } from "@/lib/pwa-utils";

import "@/styles/globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith("/admin");

  // Register service worker for PWA functionality
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return (
    <html lang="en">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
        <meta name="theme-color" content="#072446" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta
          name="description"
          content="GatherEase - Your all-in-one event management platform"
        />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className={`font-sans ${GeistSans.variable}`}>
        <ClerkProvider
          publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
          signInUrl="/sign-in"
          signUpUrl="/sign-up"
          signOutUrl="/sign-out"
          signInFallbackRedirectUrl="/admin/dashboard"
          signUpFallbackRedirectUrl="/admin/dashboard"
        >
          <TRPCReactProvider>
            <ErrorBoundary>
              {isAdminPage ? (
                <div className="flex h-screen">
                  <div className="flex-1 overflow-auto">{children}</div>
                </div>
              ) : (
                <>
                  <Navbar />
                  {children}
                </>
              )}
            </ErrorBoundary>
          </TRPCReactProvider>
          <Toaster />
          <InstallPWAPrompt />
          <OfflineIndicator />
        </ClerkProvider>
      </body>
    </html>
  );
}
