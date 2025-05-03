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

export function AttendeeSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

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
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-[#072446] text-[#B0B8C5] transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "md:h-screen md:translate-x-0",
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center px-6">
          <h1 className="text-xl font-bold text-white">
            GatherEase
          </h1>
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
          />
        </div>
      </div>
    </>
  );
}
