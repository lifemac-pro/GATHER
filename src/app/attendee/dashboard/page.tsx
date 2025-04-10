"use client";

import React, { useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/ui/sidebar";
import EventCard from "@/components/ui/EventCard";
import { Menu, X } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { SignOutButton } from "@/components/ui/sign-out-button";

const Dashboard = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useUser();

  return (
    <div className="relative flex min-h-screen flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="sticky top-0 hidden h-screen md:block">
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
          mobileMenuOpen ? "visible opacity-100" : "invisible opacity-0"
        }`}
        onClick={() => setMobileMenuOpen(false)}
      >
        <aside
          className={`fixed left-0 top-0 h-screen w-64 transform bg-[#072446] text-[#B0B8C5] shadow-lg transition-transform duration-300 ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="absolute right-4 top-4 text-white"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close Menu"
          >
            <X size={24} />
          </button>
          <Sidebar />
        </aside>
      </div>

      {/* Main Content */}
      <main className="flex-1 bg-[#6fc3f7] p-6">
        {/* Welcome Message */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 md:text-3xl">
              Welcome, {user?.firstName || "Guest"}! 👋
            </h1>
            <p className="text-sm text-gray-600 md:text-base">
              Manage your event registrations and feedback.
            </p>
          </div>

          {/* Admin and Sign Out Buttons */}
          <div className="flex space-x-2">
            <Link
              href="/admin"
              className="rounded-md bg-[#072446] px-4 py-2 text-white transition hover:bg-[#0a3060]"
            >
              Admin Panel
            </Link>
            <SignOutButton
              redirectUrl="/"
              className="rounded-md bg-red-500 px-4 py-2 text-white transition hover:bg-red-600"
            >
              Sign Out
            </SignOutButton>
          </div>
        </div>

        {/* Upcoming Events Section */}
        <section className="mt-6">
          <h2 className="text-xl font-semibold text-gray-800 md:text-2xl">
            Events
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
