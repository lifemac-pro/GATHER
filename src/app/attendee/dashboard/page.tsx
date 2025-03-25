"use client";

import React, { useState } from "react";
import Sidebar from "@/components/ui/sidebar";
import EventCard from "@/components/ui/EventCard";
import { Menu } from "lucide-react"; // Icon for mobile menu button (optional)

const Dashboard = () => {
  // Toggle for mobile menu
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* Desktop Sidebar (hidden on mobile) */}
      <aside className="hidden md:block sticky top-0">
        <Sidebar />
      </aside>

      {/* Mobile Navbar (visible on small screens) */}
      <nav className="flex items-center justify-between bg-[#072446] p-4 md:hidden">
        <h2 className="text-xl font-bold text-[#E1A913]">GatherEase</h2>
        <button
          className="text-white"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <Menu size={24} />
        </button>
      </nav>

      {/* Mobile Sidebar (slides in/out) */}
      {mobileMenuOpen && (
        <aside className="md:hidden absolute z-50 top-16 left-0 w-60 bg-[#072446] text-[#B0B8C5] p-5 h-full shadow-lg">
          <Sidebar />
        </aside>
      )}

      {/* Main Content */}
      <main className="flex-1 p-6 bg-[#6fc3f7]">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          Welcome, User!
        </h1>
        <p className="text-sm md:text-base text-gray-500">
          Manage your event registrations and feedback.
        </p>

        <section className="mt-6">
          <h2 className="text-xl md:text-2xl font-semibold text-gray-800">
            Upcoming Events
          </h2>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <EventCard
              title="Tech Conference 2025"
              date="March 30, 2025"
              status="Registered"
            />
            <EventCard
              title="Startup Pitch Night"
              date="April 5, 2025"
              status="Not Registered"
            />
            <EventCard
              title="AI & Web3 Summit"
              date="May 15, 2025"
              status="Not Registered"
            />
            <EventCard title="PSP" date="May 15, 2025" status="Not Registered" />
            <EventCard
              title="YLT"
              date="June 24, 2025"
              status="Registered"
            />
            <EventCard
              title="NORNUVI"
              date="April 18, 2025"
              status="Not Registered"
            />
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
