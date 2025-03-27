"use client";

import React, { useState } from "react";
import Sidebar from "@/components/ui/sidebar";
import EventCard from "@/components/ui/EventCard";
import { Menu, X } from "lucide-react";

const Dashboard = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex flex-col md:flex-row min-h-screen relative">
      {/* Desktop Sidebar (Always Visible on Large Screens) */}
      <aside className="hidden md:block sticky top-0 h-screen">
        <Sidebar />
      </aside>

      {/* Mobile Navbar */}
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

        {/* Upcoming Events Section */}
        <section className="mt-6">
          <h2 className="text-xl md:text-2xl font-semibold text-gray-800">
            Events
          </h2>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                title: "Tech Conference 2025",
                date: "March 30, 2025",
                status: "Registered" as "Registered",
                image: "/images/tech-conference.jpg",
              },
              {
                title: "Startup Pitch Night",
                date: "April 5, 2025",
                status: "Not Registered" as "Not Registered",
                image: "/images/startup-pitch.jpg",
              },
              {
                title: "AI & Web3 Summit",
                date: "May 15, 2025",
                status: "Not Registered" as "Not Registered",
                image: "/images/ai-web3-summit.jpg",
              },
              {
                title: "PSP",
                date: "May 15, 2025",
                status: "Not Registered" as "Not Registered",
                image: "/images/psp-event.jpg",
              },
              {
                title: "YLT",
                date: "June 24, 2025",
                status: "Registered" as "Registered",
                image: "/images/ylt-event.jpg",
              },
              {
                title: "NORNUVI",
                date: "April 18, 2025",
                status: "Not Registered" as "Not Registered",
                image: "/images/nornuvi-event.jpg",
              },
            ].map((event, index) => (
              <EventCard key={index} {...event} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
