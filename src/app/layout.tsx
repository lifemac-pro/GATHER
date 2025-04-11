"use client";

import { GeistSans } from "geist/font/sans";
import { Toaster } from "sonner";
import { Navbar } from "@/components/ui/navbar";
import { ClerkProvider } from "@clerk/nextjs";
import { TRPCReactProvider } from "@/trpc/react";
import { Sidebar } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { ErrorBoundary } from "@/components/error-boundary";

import "@/styles/globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith('/admin');

  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable}`}>
        <ClerkProvider
          publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
          signInUrl="/sign-in"
          signUpUrl="/sign-up"
        >
          <TRPCReactProvider>
            <ErrorBoundary>
              {isAdminPage ? (
                <div className="flex h-screen">
                  <Sidebar />
                  <div className="flex-1 overflow-auto">
                    {children}
                  </div>
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
        </ClerkProvider>
      </body>
    </html>
  );
}
