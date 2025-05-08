"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "./button";
import { UserButton, useAuth, useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { Calendar, Home, LogIn } from "lucide-react";
import { MobileNav } from "./mobile-nav";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();
  const { userId } = useAuth();
  const { isSignedIn, user } = useUser();
  const [mounted, setMounted] = useState(false);

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  const isActive = (path: string) => pathname === path;

  if (!mounted) {
    // Return a placeholder with the same height to prevent layout shift
    return (
      <div className="h-16 border-b border-border bg-background shadow-sm"></div>
    );
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background shadow-sm">
      <div className="container flex h-16 items-center">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            <MobileNav />
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold">
                Gather<span className="text-primary">Ease</span>
              </span>
            </Link>
          </div>

          {/* Desktop navigation - removed */}
          <nav className="hidden items-center gap-6 md:flex">
            {/* Navigation items removed */}
          </nav>

          {/* Auth buttons */}
          <div className="flex items-center gap-2">
            {!isSignedIn ? (
              <Link href="/sign-in">
                <Button size="sm" className="hidden md:flex">
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign in
                </Button>
              </Link>
            ) : (
              <UserButton afterSignOutUrl="/" />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
