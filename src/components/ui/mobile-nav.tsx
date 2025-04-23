"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { UserButton, useUser } from "@clerk/nextjs";
import {
  Menu,
  Home,
  Calendar,
  Users,
  Settings,
  LogIn,
  BarChart,
  PlusCircle,
  Bell,
} from "lucide-react";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { isSignedIn, user } = useUser();
  const [mounted, setMounted] = useState(false);

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close sheet when route changes
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  if (!mounted) return null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex flex-col">
        <div className="px-2 py-4">
          <h2 className="mb-2 text-lg font-bold">GatherEase</h2>
          {isSignedIn && (
            <div className="mb-6 flex items-center gap-2">
              <UserButton afterSignOutUrl="/" />
              <div className="text-sm">
                <p className="font-medium">
                  {user?.fullName || user?.username}
                </p>
                <p className="text-muted-foreground">
                  {user?.primaryEmailAddress?.emailAddress}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 px-2">
          <div className="space-y-1">
            <Link href="/" passHref>
              <Button
                variant={pathname === "/" ? "default" : "ghost"}
                className="w-full justify-start"
              >
                <Home className="mr-2 h-4 w-4" />
                Home
              </Button>
            </Link>

            <Link href="/events" passHref>
              <Button
                variant={pathname === "/events" ? "default" : "ghost"}
                className="w-full justify-start"
              >
                <Calendar className="mr-2 h-4 w-4" />
                Events
              </Button>
            </Link>

            {isSignedIn && (
              <>
                <Link href="/admin/dashboard" passHref>
                  <Button
                    variant={
                      pathname === "/admin/dashboard" ? "default" : "ghost"
                    }
                    className="w-full justify-start"
                  >
                    <BarChart className="mr-2 h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>

                <Link href="/admin/events" passHref>
                  <Button
                    variant={pathname === "/admin/events" ? "default" : "ghost"}
                    className="w-full justify-start"
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    My Events
                  </Button>
                </Link>

                <Link href="/admin/attendees" passHref>
                  <Button
                    variant={
                      pathname === "/admin/attendees" ? "default" : "ghost"
                    }
                    className="w-full justify-start"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Attendees
                  </Button>
                </Link>

                <Link href="/admin/notifications" passHref>
                  <Button
                    variant={
                      pathname === "/admin/notifications" ? "default" : "ghost"
                    }
                    className="w-full justify-start"
                  >
                    <Bell className="mr-2 h-4 w-4" />
                    Notifications
                  </Button>
                </Link>

                <Link href="/admin/settings" passHref>
                  <Button
                    variant={
                      pathname === "/admin/settings" ? "default" : "ghost"
                    }
                    className="w-full justify-start"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>

        {!isSignedIn && (
          <div className="border-t px-2 py-4">
            <Link href="/sign-in" passHref>
              <Button className="w-full">
                <LogIn className="mr-2 h-4 w-4" />
                Sign In
              </Button>
            </Link>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
