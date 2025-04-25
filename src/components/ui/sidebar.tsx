"use client";

import { Home, Calendar, List, Settings, LogOut, Bell } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/ui/sign-out-button";
import { useNotifications } from "@/context/notification-context";

const Sidebar = () => {
  const pathname = usePathname();
  const { unreadCount, isError } = useNotifications();

  const isActive = (path: string) => pathname === path;

  return (
    <div className="sticky top-0 flex h-screen w-64 flex-col justify-between overflow-y-auto bg-gradient-to-b from-[#082865] to-[#004BD9] p-6 text-white">
      {/* Navigation Links */}
      <div>
        <h2 className="mb-8 text-2xl font-bold text-white">GatherEase</h2>
        <nav className="space-y-6">
          <Link
            href="/attendee/dashboard"
            className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${isActive("/attendee/dashboard")
              ? "bg-white/10 text-white font-medium"
              : "text-white/70 hover:bg-white/5 hover:text-white"}`}
          >
            <Home size={18} strokeWidth={2} /> Dashboard
          </Link>
          <Link
            href="/attendee/events"
            className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${isActive("/attendee/events")
              ? "bg-white/10 text-white font-medium"
              : "text-white/70 hover:bg-white/5 hover:text-white"}`}
          >
            <Calendar size={18} strokeWidth={2} /> My Events
          </Link>
          <Link
            href="/attendee/notifications"
            className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${isActive("/attendee/notifications")
              ? "bg-white/10 text-white font-medium"
              : "text-white/70 hover:bg-white/5 hover:text-white"}`}
          >
            <Bell size={18} strokeWidth={2} />
            <span className="flex-1">Notifications</span>
            {!isError && unreadCount && unreadCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0055FF] text-xs font-medium text-white">
                {unreadCount}
              </span>
            )}
          </Link>
          <Link
            href="/attendee/surveys"
            className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${isActive("/attendee/surveys")
              ? "bg-white/10 text-white font-medium"
              : "text-white/70 hover:bg-white/5 hover:text-white"}`}
          >
            <List size={18} strokeWidth={2} /> Surveys
          </Link>
          <Link
            href="/attendee/settings"
            className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${isActive("/attendee/settings")
              ? "bg-white/10 text-white font-medium"
              : "text-white/70 hover:bg-white/5 hover:text-white"}`}
          >
            <Settings size={18} strokeWidth={2} /> Settings
          </Link>
        </nav>
      </div>

      {/* Logout Button */}
      <SignOutButton
        redirectUrl="/"
        className="mt-6 flex items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white backdrop-blur-sm transition-all hover:bg-white/10"
      >
        <LogOut size={18} strokeWidth={2} /> Sign Out
      </SignOutButton>
    </div>
  );
};

export default Sidebar;
