"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Calendar, Users, BarChart3, ClipboardList, Settings, LogOut, ChevronLeft, ChevronRight } from "lucide-react";

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
  const [isOpen, setIsOpen] = useState(true); // Controls sidebar open/close

  return (
    <>
      {/* ✅ Mobile Sidebar (Sheet) */}
      <Sheet>
        <SheetTrigger asChild>
          <button 
            className="md:hidden p-3 fixed top-4 left-4 bg-[#00b0a6] text-white rounded-md z-50"
            onClick={() => console.log("Sidebar Button Clicked")} // Debugging
          >
            <Menu size={24} />
          </button>
        </SheetTrigger>
        <SheetContent 
          side="left" 
          className="bg-[#072446] text-[#B0B8C5] w-64 z-50"
        >
          <SidebarContent pathname={pathname} />
        </SheetContent>
      </Sheet>

      {/* ✅ Desktop Sidebar */}
      <div className={`hidden md:flex flex-col bg-[#072446] text-[#B0B8C5] min-h-screen transition-all duration-300 ${isOpen ? "w-64" : "w-20"} p-4 relative`}>
        {/* Toggle Button */}
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="absolute top-5 -right-5 bg-[#00b0a6] text-white p-1 rounded-full"
        >
          {isOpen ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
        </button>

        <h2 className={`text-xl font-bold text-white mb-6 transition-opacity ${isOpen ? "opacity-100" : "opacity-0 hidden"}`}>Admin Panel</h2>

        <SidebarContent pathname={pathname} isOpen={isOpen} />

        <Button variant="destructive" className="mt-auto w-full flex items-center space-x-2">
          <LogOut size={20} />
          {isOpen && <span>Logout</span>}
        </Button>
      </div>
    </>
  );
}

// ✅ Sidebar Navigation Content Component
function SidebarContent({ pathname, isOpen = true }: { pathname: string; isOpen?: boolean }) {
  return (
    <nav className="space-y-4">
      {navItems.map((item, index) => (
        <Link
          key={index}
          href={item.href}
          className={`flex items-center space-x-3 p-3 rounded-md transition ${
            pathname === item.href ? "bg-[#00b0a6] text-white" : "hover:text-[#E1A913]"
          }`}
        >
          {item.icon}
          {isOpen && <span>{item.name}</span>}
        </Link>
      ))}
    </nav>
  );
}
