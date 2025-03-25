"use client";

import { Home, Calendar, List, Settings, LogOut } from "lucide-react";
import Link from "next/link";

const Sidebar = () => {
  return (
    <div className="sticky top-0 h-screen w-60 overflow-y-auto bg-[#072446] p-5 text-[#B0B8C5]">
      <h2 className="mb-6 text-xl font-bold text-[#E1A913]">GatherEase</h2>
      <nav className="space-y-4">
        <Link href="/attendee/dashboard" className="flex items-center gap-2 hover:text-[#00b0a6]">
          <Home size={20} /> Dashboard
        </Link>
        <Link href="/attendee/events" className="flex items-center gap-2 hover:text-[#00b0a6]">
          <Calendar size={20} /> My Events
        </Link>
        <Link href="/attendee/surveys" className="flex items-center gap-2 hover:text-[#00b0a6]">
          <List size={20} /> Surveys
        </Link>
        <Link href="/attendee/settings" className="flex items-center gap-2 hover:text-[#00b0a6]">
          <Settings size={20} /> Settings
        </Link>
        <Link href="/attendee/logout" className="flex items-center gap-2 hover:text-[#00b0a6]">
          <LogOut size={20} /> Logout
        </Link>
      </nav>
    </div>
  );
};

export default Sidebar;
