"use client";

import React, { useState } from "react";
import Image from "next/image";
import Sidebar from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

const EventsPage = () => {
  // Toggle state for mobile sidebar
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex flex-col md:flex-row min-h-screen relative">
      {/* Desktop Sidebar (Only visible on large screens) */}
      <aside className="hidden md:block sticky top-0">
        <Sidebar />
      </aside>

      {/* Mobile Navbar */}
      <nav className="flex items-center justify-between bg-[#072446] p-4 md:hidden">
        <h2 className="text-xl font-bold text-[#E1A913]">GatherEase</h2>
        <button
          className="text-white"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>
      </nav>

      {/* Mobile Sidebar with Overlay */}
      <div
        className={`fixed inset-0 z-50 flex transition-transform duration-300 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar (Left Half) */}
        <div className="w-2/3 max-w-[280px] h-screen bg-[#072446] text-[#B0B8C5] shadow-lg relative overflow-y-auto">
          {/* Close Button */}
          <button
            className="absolute top-4 right-4 text-white"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={24} />
          </button>

          {/* Sidebar Content */}
          <div className="p-5">
            <Sidebar />
          </div>
        </div>

        {/* Overlay (Right Half - Click to Close) */}
        <div
          className="flex-1 h-screen bg-black bg-opacity-50"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
          tabIndex={-1}
        ></div>
      </div>

      {/* Main Content */}
      <main className="flex-1 bg-[#6fc3f7] p-6">
        <h1 className="mb-6 text-2xl md:text-3xl font-bold text-black">
          Upcoming Events
        </h1>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { title: "Tech Conference 2025", date: "March 30, 2025", image: "/images/tech-conference.jpg" },
            { title: "AI & Web3 Summit 2025", date: "April 10, 2025", image: "/images/ai-web3-summit.jpg" },
            { title: "Startup Pitch Night", date: "April 30, 2025", image: "/images/startup-pitch.jpg" },
            { title: "African Youth Day 2025", date: "March 28, 2025", image: "/images/african-youth-day.jpg" },
            { title: "YLT 2025", date: "June 24, 2025", image: "/images/ylt-event.jpg" },
            { title: "PSP 2025", date: "May 25, 2025", image: "/images/psp-event.jpg" },
          ].map((event, index) => (
            <Card
              key={index}
              className="rounded-lg bg-[#072446] shadow-lg text-[#E1A913] overflow-hidden relative z-10"
            >
              {/* Event Image */}
              <div className="relative w-full h-40">
                <Image
                  src={event.image}
                  alt={event.title}
                  layout="fill"
                  objectFit="cover"
                  className="rounded-t-lg"
                />
              </div>

              {/* Event Details */}
              <CardHeader className="p-4">
                <CardTitle>{event.title}</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <p className="text-[#00b0a6]">Date: {event.date}</p>
                <Button
                  variant="outline"
                  className="mt-4 w-full bg-blue-600 text-white hover:bg-blue-700"
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
