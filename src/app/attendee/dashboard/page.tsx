"use client";

import React, { useState } from "react";
import Sidebar from "@/components/ui/sidebar";
import EventCard from "@/components/ui/EventCard";
import { Menu, X } from "lucide-react"; // Added close icon for better UX

/*************  ✨ Codeium Command ⭐  *************/
/**
 * Dashboard component that renders the main user interface for attendees.
 * 
 * Features include:
 * - A responsive sidebar that is always visible on large screens and 
 *   slides in from the left on smaller screens.
 * - A mobile-friendly navbar for toggling the sidebar.
 * - Main content area displaying a welcome message and upcoming events.
 * 
 * State:
 * - mobileMenuOpen: Boolean state for toggling the visibility of the mobile sidebar.
 * 
 * The component is structured for optimal display across various screen sizes,
 * utilizing a mix of CSS Flexbox and Grid for layout management.
 */

/******  fb9e91f2-fef0-400c-8c9c-370f96de60f5  *******/const Dashboard = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex flex-col md:flex-row min-h-screen relative">
      {/* Desktop Sidebar (Always Visible on Large Screens) */}
      <aside className="hidden md:block sticky top-0 h-screen">
        <Sidebar />
      </aside>

      {/* Mobile Navbar (No duplicate title here) */}
      <nav className="flex items-center justify-between bg-[#072446] p-4 md:hidden">
        <button
          className="text-white"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open Menu"
        >
          <Menu size={24} />
        </button>
      </nav>

      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-0 z-50 bg-black bg-opacity-50 transition-opacity duration-300 ${
          mobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        onClick={() => setMobileMenuOpen(false)}
      >
        <aside
          className={`fixed top-0 left-0 h-screen w-64 bg-[#072446] text-[#B0B8C5] shadow-lg transform transition-transform duration-300 ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* No extra title here */}
          <button
            className="absolute top-4 right-4 text-white"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close Menu"
          >
            <X size={24} />
          </button>
          <Sidebar />
        </aside>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-6 bg-[#6fc3f7]">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          Welcome, User!
        </h1>
        <p className="text-sm md:text-base text-gray-600">
          Manage your event registrations and feedback.
        </p>

        <section className="mt-6">
          <h2 className="text-xl md:text-2xl font-semibold text-gray-800">
            Upcoming Events
          </h2>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <EventCard title="Tech Conference 2025" date="March 30, 2025" status="Registered" />
            <EventCard title="Startup Pitch Night" date="April 5, 2025" status="Not Registered" />
            <EventCard title="AI & Web3 Summit" date="May 15, 2025" status="Not Registered" />
            <EventCard title="PSP" date="May 15, 2025" status="Not Registered" />
            <EventCard title="YLT" date="June 24, 2025" status="Registered" />
            <EventCard title="NORNUVI" date="April 18, 2025" status="Not Registered" />
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
