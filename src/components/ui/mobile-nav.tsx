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
  FileText,
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
            {/* Navigation items removed */}
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
