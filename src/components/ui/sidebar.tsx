"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Calendar, Users, BarChart3, ClipboardList, Settings, ChevronLeft, ChevronRight } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navItems = [
  { name: "Dashboard", href: "/admin", icon: <BarChart3 size={20} /> },
  { name: "Manage Events", href: "/admin/events", icon: <Calendar size={20} /> },
  { name: "Attendees", href: "/admin/attendees", icon: <Users size={20} /> },
  { name: "Analytics & Reports", href: "/admin/analytics", icon: <BarChart3 size={20} /> },
  { name: "Surveys", href: "/admin/surveys", icon: <ClipboardList size={20} /> },
  { name: "Settings", href: "/admin/settings", icon: <Settings size={20} /> },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);

  return (
    <>
      {/* ✅ Mobile Sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <button className="md:hidden fixed top-4 left-4 bg-[#00b0a6] text-white p-2 rounded-md z-50">
            <Menu size={24} />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="bg-[#072446] text-[#B0B8C5] w-64 z-50">
          <SidebarContent pathname={pathname} />
        </SheetContent>
      </Sheet>

      {/* ✅ Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col bg-[#072446] text-[#B0B8C5] fixed left-0 top-0 h-screen transition-all duration-300
          ${isOpen ? "w-64" : "w-20"} border-r border-gray-700 shadow-lg relative`}
      >
        {/* ✅ Sidebar Header */}
        <div className="flex items-center justify-between px-4 py-5">
          {isOpen ? (
            <h2 className="text-xl font-bold text-white">Admin Panel</h2>
          ) : (
            <div className="w-10 h-10 bg-white text-black flex items-center justify-center rounded-full font-bold">
              N
            </div>
          )}

          {/* ✅ Collapse Button (Always Visible) */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="bg-[#00b0a6] text-white p-2 rounded-full shadow-md transition"
            aria-label={isOpen ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            {isOpen ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
          </button>
        </div>

        {/* ✅ Sidebar Links */}
        <SidebarContent pathname={pathname} isOpen={isOpen} />
      </aside>
    </>
  );
}

// ✅ Sidebar Content Component
function SidebarContent({ pathname, isOpen = true }: { pathname: string; isOpen?: boolean; closeSidebar?: () => void }) {
  return (
    <nav className="space-y-1 px-2">
      {navItems.map((item, index) => (
        <Link
          key={index}
          href={item.href}
          className={`flex items-center space-x-3 p-3 rounded-md transition duration-200
            ${pathname === item.href ? "bg-[#00b0a6] text-white" : "hover:bg-[#E1A913] hover:text-white"}
            ${isOpen ? "justify-start" : "justify-center"}`}
        >
          {item.icon}
          {isOpen && <span>{item.name}</span>}
        </Link>
      ))}
    </nav>
  );
}
