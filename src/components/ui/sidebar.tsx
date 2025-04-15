"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react"; // <-- import useState
import { SignOutButton } from "@clerk/nextjs";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  BarChart2,
  FileText,
  Settings,
  LogOut,
  Menu
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
      <div className="md:hidden p-4">
        <Button variant="ghost" onClick={() => setIsOpen(!isOpen)}>
          <Menu className="h-6 w-6" />
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-primary text-primary-foreground/70 transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "md:translate-x-0  md:h-screen"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center px-6">
          <h1 className="text-xl font-bold text-primary-foreground">GatherEase</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary-foreground/10 text-primary-foreground"
                    : "hover:bg-primary-foreground/5 hover:text-primary-foreground"
                )}
              >
                <item.icon
                  className={cn(
                    "mr-3 h-5 w-5",
                    isActive ? "text-primary-foreground" : "text-primary-foreground/80"
                  )}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="border-t border-primary-foreground/10 p-4">
          <SignOutButton>
            <Button
              variant="ghost"
              className="w-full justify-start text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <LogOut className="mr-3 h-5 w-5 text-primary-foreground/80" />
              Sign Out
            </Button>
          </SignOutButton>
        </div>
      </div>
    </>
  );
}
