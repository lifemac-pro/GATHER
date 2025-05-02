"use client";

import { AttendeeSidebar } from "@/components/ui/attendee/sidebar";
import { useUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function AttendeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoaded, isSignedIn } = useUser();

  // Show loading state while checking authentication
  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  // Redirect to sign-in if not authenticated
  if (!isSignedIn) {
    redirect("/sign-in?redirect=/attendee/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <AttendeeSidebar />
      <main className="flex-1 md:ml-64">
        {children}
      </main>
    </div>
  );
}
