"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "./button";
import { useAuth } from "@clerk/nextjs";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const { userId } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-background border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-primary">
                GatherEase
              </Link>
            </div>
            {/* Desktop navigation */}
            <div className="hidden md:ml-6 md:flex md:space-x-8">
              <Link
                href="/admin/dashboard"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive("/admin/dashboard")
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                }`}
              >
                Dashboard
              </Link>
              {/* {userId && (
                <Link
                  href="/events"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    isActive("/events")
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                  }`}
                >
                  Events
                </Link>
              )} */}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="-mr-2 flex items-center md:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>

          {/* Desktop auth buttons */}
          <div className="hidden md:flex md:items-center">
            {!userId && (
              <Link
                href="/sign-in"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Sign in
              </Link>
            )}
            {userId && (
              <Link
                href="/sign-out"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Sign out
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      {isMenuOpen && (
        <div className="md:hidden bg-background">
          <div className="pt-2 pb-3 space-y-1">
            <Link
              href="/admin/dashboard"
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                isActive("/admin/dashboard")
                  ? "border-primary text-primary bg-accent"
                  : "border-transparent text-muted-foreground hover:bg-accent hover:border-border hover:text-foreground"
              }`}
            >
              Dashboard
            </Link>
            {userId && (
              <Link
                href="/events"
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  isActive("/events")
                    ? "border-primary text-primary bg-accent"
                    : "border-transparent text-muted-foreground hover:bg-accent hover:border-border hover:text-foreground"
                }`}
              >
                Events
              </Link>
            )}
          </div>
          <div className="pt-4 pb-3 border-t border-border">
            <div className="mt-3 space-y-1">
              {!userId && (
                <Link
                  href="/sign-in"
                  className="block px-4 py-2 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent"
                >
                  Sign in
                </Link>
              )}
              {userId && (
                <Link
                  href="/sign-out"
                  className="block px-4 py-2 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent"
                >
                  Sign out
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
