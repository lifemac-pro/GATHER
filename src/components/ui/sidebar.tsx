"use client";

import { Home, Calendar, List, Settings, LogOut, Bell } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { trpc } from "@/utils/trpc";

const Sidebar = () => {
  const pathname = usePathname();
  const { data: unreadCount } = trpc.notification.getUnreadCount.useQuery();

  const isActive = (path: string) => pathname === path;

  return (
    <div className="sticky top-0 flex h-screen w-60 flex-col justify-between overflow-y-auto bg-[#072446] p-5 text-[#B0B8C5]">
      {/* Navigation Links */}
      <div>
        <h2 className="mb-6 text-xl font-bold text-[#E1A913]">GatherEase</h2>
        <nav className="space-y-4">
          <Link
            href="/attendee/dashboard"
            className={`flex items-center gap-2 hover:text-[#00b0a6] ${
              isActive("/attendee/dashboard") ? "text-[#00b0a6]" : ""
            }`}
          >
            <Home size={20} /> Dashboard
          </Link>
          <Link
            href="/attendee/events"
            className={`flex items-center gap-2 hover:text-[#00b0a6] ${
              isActive("/attendee/events") ? "text-[#00b0a6]" : ""
            }`}
          >
            <Calendar size={20} /> My Events
          </Link>
          <Link
            href="/attendee/notifications"
            className={`flex items-center gap-2 hover:text-[#00b0a6] ${
              isActive("/attendee/notifications") ? "text-[#00b0a6]" : ""
            }`}
          >
            <Bell size={20} /> Notifications
            {unreadCount && unreadCount > 0 && (
              <span className="rounded-full bg-red-500 px-2 py-1 text-xs text-white">
                {unreadCount}
              </span>
            )}
          </Link>
          <Link
            href="/attendee/surveys"
            className={`flex items-center gap-2 hover:text-[#00b0a6] ${
              isActive("/attendee/surveys") ? "text-[#00b0a6]" : ""
            }`}
          >
            <List size={20} /> Surveys
          </Link>
          <Link
            href="/attendee/settings"
            className={`flex items-center gap-2 hover:text-[#00b0a6] ${
              isActive("/attendee/settings") ? "text-[#00b0a6]" : ""
            }`}
          >
            <Settings size={20} /> Settings
          </Link>
        </nav>
      </div>

      {/* Logout Button */}
      <button
        onClick={() => (window.location.href = "/")}
        className="mt-4 flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white transition hover:bg-red-700"
      >
        <LogOut size={20} /> Sign Out
      </button>
    </div>
  );
};

export default Sidebar;
