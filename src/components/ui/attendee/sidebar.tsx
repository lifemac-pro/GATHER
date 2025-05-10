"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { SignOutButton } from "@/components/ui/sign-out-button";
import {
  LayoutDashboard,
  CalendarDays,
  FileText,
  Settings,
  LogOut,
  Menu,
  Bell,
  Search,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../button";

const navigation = [
  {
    name: "Dashboard",
    href: "/attendee/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Browse Events",
    href: "/events",
    icon: Search,
  },
  {
    name: "My Events",
    href: "/attendee/events",
    icon: CalendarDays,
  },
  {
    name: "Surveys",
    href: "/attendee/surveys",
    icon: FileText,
  },
  {
    name: "Notifications",
    href: "/attendee/notifications",
    icon: Bell,
  },
  {
    name: "Settings",
    href: "/attendee/settings",
    icon: Settings,
  },
];

interface AttendeeSidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function AttendeeSidebar({ isOpen, setIsOpen }: AttendeeSidebarProps) {
  const pathname = usePathname();

  return (
    <>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-[#072446] text-[#B0B8C5] transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full", // Toggle on mobile
          "md:translate-x-0 md:h-screen", // Always visible on desktop
        )}
      >
        {/* Logo and Close Button */}
        <div className="flex h-16 items-center justify-between px-6">
          <h1 className="text-xl font-bold text-white">
            GatherEase
          </h1>
          {/* Close button - only visible on mobile */}
          <Button
            variant="ghost"
            size="icon"
            className="text-white md:hidden"
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
                    ? "bg-white/10 text-[#00b0a6]"
                    : "hover:bg-white/5 hover:text-[#00b0a6]",
                )}
              >
                <item.icon
                  className={cn(
                    "mr-3 h-5 w-5",
                    isActive
                      ? "text-[#00b0a6]"
                      : "text-[#B0B8C5]",
                  )}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="border-t border-white/10 p-4">
          <SignOutButton
            variant="ghost"
            className="w-full justify-start text-[#B0B8C5] hover:bg-white/10 hover:text-white"
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
