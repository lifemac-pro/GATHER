"use client";

import React, { useState } from "react";
import Image from "next/image";
import Sidebar from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { trpc } from "@/utils/trpc"; // Import tRPC hook

const EventsPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Track loading state for each event registration
  const [loadingEvent, setLoadingEvent] = useState<number | null>(null);

  // Mock user ID (Replace with real user data)
  const userId = 1;

  // Register mutation using tRPC
  const registerMutation = trpc.event.register.useMutation();

  // Function to handle event registration
  const handleRegister = async (eventId: number) => {
    if (loadingEvent === eventId) return; // Prevent duplicate requests
    setLoadingEvent(eventId);

    try {
      await registerMutation.mutateAsync({ eventId, userId });
      alert("Registration successful!");
    } catch (error) {
      console.error("Registration failed:", error);
      alert("Failed to register. Please try again.");
    }

    setLoadingEvent(null); // Reset loading state
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen relative">
      <aside className="hidden md:block sticky top-0">
        <Sidebar />
      </aside>

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
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="w-2/3 max-w-[280px] h-screen bg-[#072446] text-[#B0B8C5] shadow-lg relative overflow-y-auto">
            <button
              className="absolute top-4 right-4 text-white"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close menu"
            >
              <X size={24} />
            </button>
            <div className="p-5">
              <Sidebar />
            </div>
          </div>
          <div
            className="flex-1 h-screen bg-black bg-opacity-50"
            onClick={() => setMobileMenuOpen(false)}
          ></div>
        </div>
      )}

      <main className="flex-1 bg-[#6fc3f7] p-6">
        <h1 className="mb-6 text-2xl md:text-3xl font-bold text-black">
          Upcoming Events
        </h1>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { id: 1, title: "Tech Conference 2025", date: "March 30, 2025", image: "/images/tech-conference.jpg" },
            { id: 2, title: "AI & Web3 Summit 2025", date: "April 10, 2025", image: "/images/ai-web3-summit.jpg" },
            { id: 3, title: "Startup Pitch Night", date: "April 30, 2025", image: "/images/startup-pitch.jpg" },
            { id: 4, title: "African Youth Day 2025", date: "March 28, 2025", image: "/images/african-youth-day.jpg" },
            { id: 5, title: "YLT 2025", date: "June 24, 2025", image: "/images/ylt-event.jpg" },
            { id: 6, title: "PSP 2025", date: "May 25, 2025", image: "/images/psp-event.jpg" },
          ].map((event) => (
            <Card key={event.id} className="rounded-lg bg-[#072446] shadow-lg text-[#E1A913] overflow-hidden">
              <div className="relative w-full h-40">
                <Image
                  src={event.image}
                  alt={event.title}
                  layout="fill"
                  objectFit="cover"
                  className="rounded-t-lg"
                />
              </div>

              <CardHeader className="p-4">
                <CardTitle>{event.title}</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <p className="text-[#00b0a6]">Date: {event.date}</p>
                <Button
                  variant="outline"
                  className={`mt-4 w-full ${
                    loadingEvent === event.id ? "bg-gray-500 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                  }`}
                  disabled={loadingEvent === event.id}
                  onClick={() => handleRegister(event.id)}
                >
                  {loadingEvent === event.id ? "Registering..." : "Register"}
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
