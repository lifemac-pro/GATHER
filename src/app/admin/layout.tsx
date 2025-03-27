"use client";
import React, { useState } from "react";
import Sidebar from "@/components/ui/sidebar";
import Navbar from "@/components/ui/navbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar (Fixed to the Left, Full Height) */}
      <aside className="fixed top-0 left-0 h-screen w-64 bg-[#1A1A2E] shadow-lg z-40">
        <Sidebar />
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex flex-col flex-grow ml-64">
        {/* Fixed Navbar (Spanning Remaining Width) */}
        <header className={`transition-all duration-300 p-4 ${isOpen ? "ml-64" : "ml-20"}`}>
          <Navbar isOpen={false} />
        </header>

        {/* Content Area (Pushed Down Below Navbar) */}
        <main className="p-6 bg-[#F8FAFC] flex-grow pt-20">
          {children}
        </main>
      </div>
    </div>
  );
}
