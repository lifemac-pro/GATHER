"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react"; // <-- import useState
import { SignOutButton } from "@/components/ui/sign-out-button";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  BarChart2,
  FileText,
  Settings,
  LogOut,
  Menu,
  Activity,
} from "lucide-react"; // <-- import Menu icon for mobile toggle
import { cn } from "@/lib/utils";
import { Button } from "./button";

const navigation = [
  {
    name: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Events",
    href: "/admin/events",
    icon: CalendarDays,
  },
  {
    name: "Attendees",
    href: "/admin/attendees",
    icon: Users,
  },
  {
    name: "Analytics",
    href: "/admin/analytics",
    icon: BarChart2,
  },
  {
    name: "Real-Time",
    href: "/admin/real-time",
    icon: Activity,
  },
  {
    name: "Surveys",
    href: "/admin/surveys",
    icon: FileText,
  },
  {
    name: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false); // <-- sidebar open/close state

  return (
    <>
      {/* Mobile Hamburger */}
      <div className="p-4 md:hidden">
        <Button variant="ghost" onClick={() => setIsOpen(!isOpen)}>
          <Menu className="h-6 w-6" />
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-primary text-primary-foreground/70 transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "md:h-screen  md:translate-x-0",
        )}
      >
        {/* Logo and Close Button */}
        <div className="flex h-16 items-center justify-between px-6">
          <h1 className="text-xl font-bold text-primary-foreground">
            GatherEase
          </h1>
          {/* Close button - only visible on mobile */}
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground md:hidden"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => {
                  // Close sidebar on mobile when a link is clicked
                  if (window.innerWidth < 768) {
                    setIsOpen(false);
                  }
                }}
                className={cn(
                  "group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary-foreground/10 text-primary-foreground"
                    : "hover:bg-primary-foreground/5 hover:text-primary-foreground",
                )}
              >
                <item.icon
                  className={cn(
                    "mr-3 h-5 w-5",
                    isActive
                      ? "text-primary-foreground"
                      : "text-primary-foreground/80",
                  )}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="border-t border-primary-foreground/10 p-4">
          <SignOutButton
            variant="ghost"
            className="w-full justify-start text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground"
            showIcon={true}
            onClick={() => {
              // Close sidebar on mobile when signing out
              if (window.innerWidth < 768) {
                setIsOpen(false);
              }
            }}
          />
        </div>
      </div>
    </>
  );
}
