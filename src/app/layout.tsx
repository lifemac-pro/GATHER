"use client";

import "@/styles/globals.css";
import { GeistSans } from "geist/font/sans";
import { SessionProvider } from "next-auth/react";
import { TRPCReactProvider } from "@/trpc/react";
// import { EventProvider } from "context/EventContext";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={GeistSans.className}>
        <SessionProvider>
          <TRPCReactProvider>{children}</TRPCReactProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
