"use client";

import React, { useState } from "react";
import Sidebar from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

const EventsPage = () => {
  // Toggle state for mobile sidebar
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex flex-col md:flex-row min-h-screen relative">
      {/* Desktop Sidebar (Only visible on larger screens) */}
      <aside className="hidden md:block sticky top-0">
        <Sidebar />
      </aside>

      {/* Mobile Navbar */}
      <nav className="flex items-center justify-between bg-[#072446] p-4 md:hidden">
        <h2 className="text-xl font-bold text-[#E1A913]">GatherEase</h2>
        <button
          className="text-white"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <Menu size={24} />
        </button>
      </nav>

      {/* Mobile Sidebar (Only one instance) */}
      <div
        className={`fixed inset-0 bg-[#072446] text-[#B0B8C5] w-3/4 max-w-[250px] h-full p-5 shadow-lg transform ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out md:hidden`}
      >
        <Sidebar />
      </div>

      {/* Main Content */}
      <main className="flex-1 bg-[#6fc3f7] p-6">
        <h1 className="mb-6 text-2xl md:text-3xl font-bold text-black">
          Upcoming Events
        </h1>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { title: "Tech Conference 2025", date: "March 30, 2025" },
            { title: "AI & Web3 Summit 2025", date: "April 10, 2025" },
            { title: "Startup Pitch Night", date: "April 30, 2025" },
            { title: "African Youth Day 2025", date: "March 28, 2025" },
            { title: "YLT 2025", date: "June 24, 2025" },
            { title: "PSP 2025", date: "May 25, 2025" },
          ].map((event, index) => (
            <Card
              key={index}
              className="rounded-lg bg-[#072446] p-6 shadow-lg text-[#E1A913]"
            >
              <CardHeader>
                <CardTitle>{event.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[#00b0a6]">Date: {event.date}</p>
                <Button
                  variant="outline"
                  className="mt-4 w-full hover:bg-[#E1A913] hover:text-white"
                >
                  Register
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default EventsPage;
