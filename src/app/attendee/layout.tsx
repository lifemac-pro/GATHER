"use client";

import { AttendeeSidebar } from "@/components/ui/attendee/sidebar";
import { useUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useState } from "react";

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

  // State for mobile sidebar
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Pass state to sidebar */}
      <AttendeeSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Backdrop - only visible on mobile when sidebar is open */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile menu button */}
      <div className="fixed left-4 top-4 z-30 md:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-6 w-6" />
        </Button>
      </div>

      <main className="flex-1 pt-16 md:ml-64 md:pt-4">
        {children}
      </main>
    </div>
  );
}
