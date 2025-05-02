"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Menu, X, Home, Calendar, Users, FileText, Settings, LogOut, Activity } from "lucide-react";
import Link from "next/link";
import { UserButton, useUser } from "@clerk/nextjs";
import { NotificationCenter } from "@/components/ui/notification-center";

interface MobileLayoutProps {
  children: React.ReactNode;
  role: "admin" | "attendee";
}

export function MobileLayout({ children, role }: MobileLayoutProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useUser();
  const [isMounted, setIsMounted] = useState(false);
  
  // Prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Close the menu when the route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);
  
  // Define navigation items based on role
  const navItems = role === "admin" 
    ? [
        { name: "Dashboard", href: "/admin/dashboard", icon: Home },
        { name: "Events", href: "/admin/events", icon: Calendar },
        { name: "Attendees", href: "/admin/attendees", icon: Users },
        { name: "Surveys", href: "/admin/surveys", icon: FileText },
        { name: "Analytics", href: "/admin/analytics", icon: Activity },
        { name: "Settings", href: "/admin/settings", icon: Settings },
      ]
    : [
        { name: "Dashboard", href: "/attendee/dashboard", icon: Home },
        { name: "Events", href: "/attendee/events", icon: Calendar },
        { name: "My Tickets", href: "/attendee/tickets", icon: Users },
        { name: "Surveys", href: "/attendee/surveys", icon: FileText },
        { name: "Settings", href: "/attendee/settings", icon: Settings },
      ];
  
  if (!isMounted) {
    return null;
  }
  
  return (
    <div className="flex min-h-screen flex-col">
      {/* Mobile header */}
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[240px] p-0">
                <div className="flex h-16 items-center border-b px-4">
                  <Link href={role === "admin" ? "/admin/dashboard" : "/attendee/dashboard"} className="flex items-center gap-2 font-bold">
                    GatherEase
                  </Link>
                </div>
                <ScrollArea className="h-[calc(100vh-64px)]">
                  <div className="px-2 py-4">
                    <div className="mb-4 px-4">
                      {user && (
                        <div className="flex items-center gap-2">
                          <UserButton afterSignOutUrl="/" />
                          <div className="flex flex-col">
                            <p className="text-sm font-medium">{user.fullName || user.username}</p>
                            <p className="text-xs text-muted-foreground">{role}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <nav className="space-y-1">
                      {navItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                            pathname === item.href ? "bg-accent text-accent-foreground" : "transparent"
                          )}
                        >
                          <item.icon className="h-4 w-4" />
                          {item.name}
                        </Link>
                      ))}
                    </nav>
                    <div className="mt-4 border-t pt-4">
                      <Link
                        href="/sign-out"
                        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </Link>
                    </div>
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>
            <Link href={role === "admin" ? "/admin/dashboard" : "/attendee/dashboard"} className="flex items-center gap-2 font-bold md:hidden">
              GatherEase
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <NotificationCenter />
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>
      
      {/* Mobile footer navigation */}
      <div className="sticky bottom-0 z-40 border-t bg-background md:hidden">
        <div className="container flex h-14 items-center justify-between px-4">
          {navItems.slice(0, 5).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 text-xs",
                pathname === item.href ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
