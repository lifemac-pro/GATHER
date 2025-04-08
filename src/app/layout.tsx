import { type Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { Toaster } from "sonner";
import { Navbar } from "@/components/ui/navbar";
import { ClerkProvider } from "@clerk/nextjs";
import { TRPCReactProvider } from "@/trpc/react";

import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "GatherEase",
  description: "Event Management Made Easy",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable}`}>
        <ClerkProvider
          publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
          signInUrl="/sign-in"
          signUpUrl="/sign-up"
        >
          <TRPCReactProvider>
            <Navbar />
            {children}
          </TRPCReactProvider>
          <Toaster />
        </ClerkProvider>
      </body>
    </html>
  );
}
