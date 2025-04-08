"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@clerk/nextjs";
import { 
  LayoutDashboard, 
  CalendarDays, 
  Users, 
  BarChart2, 
  FileText, 
  Settings, 
  LogOut 
} from "lucide-react";
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

  return (
    <div className="flex h-screen w-64 flex-col bg-[#072446] text-[#B0B8C5]">
      {/* Logo */}
      <div className="flex h-16 items-center px-6">
        <h1 className="text-xl font-bold text-[#E1A913]">GatherEase</h1>
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
                  ? "bg-[#00b0a6] text-white"
                  : "hover:bg-[#00b0a6]/10 hover:text-[#00b0a6]"
              )}
            >
              <item.icon
                className={cn(
                  "mr-3 h-5 w-5",
                  isActive ? "text-white" : "text-[#00b0a6]"
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="border-t border-[#B0B8C5]/10 p-4">
        <SignOutButton>
          <Button
            variant="ghost"
            className="w-full justify-start text-[#B0B8C5] hover:bg-[#00b0a6]/10 hover:text-[#00b0a6]"
          >
            <LogOut className="mr-3 h-5 w-5 text-[#00b0a6]" />
            Sign Out
          </Button>
        </SignOutButton>
      </div>
    </div>
  );
}
