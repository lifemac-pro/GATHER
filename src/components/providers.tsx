"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { TRPCReactProvider } from "@/trpc/react";
import { Toaster } from "@/components/ui/toaster";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <TRPCReactProvider>
        {children}
        <Toaster />
      </TRPCReactProvider>
    </ClerkProvider>
  );
}
