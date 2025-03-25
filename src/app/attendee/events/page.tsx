"use client";

import React, { useState } from "react";
import Sidebar from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react"; // For the mobile menu icon (optional)

const EventsPage = () => {
  // Toggle for the mobile menu
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
        <aside className="absolute z-50 top-16 left-0 w-60 bg-[#072446] text-[#B0B8C5] p-5 h-full shadow-lg md:hidden">
          <Sidebar />
        </aside>
      )}

      {/* Main Content */}
      <main className="flex-1 bg-[#6fc3f7] p-6">
        <h1 className="mb-6 text-2xl md:text-3xl font-bold text-black">
          Upcoming Events
        </h1>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Card 1 */}
          <Card className="rounded-lg bg-[#072446] p-6 shadow-lg text-[#E1A913]">
            <CardHeader>
              <CardTitle>Tech Conference 2025</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[#00b0a6]">Date: March 30, 2025</p>
              <Button
                variant="outline"
                className="mt-4 w-full hover:bg-[#E1A913] hover:text-white"
              >
                Register
              </Button>
            </CardContent>
          </Card>

          {/* Card 2 */}
          <Card className="rounded-lg bg-[#072446] p-6 shadow-lg text-[#E1A913]">
            <CardHeader>
              <CardTitle>AI & Web3 Summit 2025</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[#00b0a6]">Date: March 30, 2025</p>
              <Button
                variant="outline"
                className="mt-4 w-full hover:bg-[#E1A913] hover:text-white"
              >
                Register
              </Button>
            </CardContent>
          </Card>

          {/* Card 3 */}
          <Card className="rounded-lg bg-[#072446] p-6 shadow-lg text-[#E1A913]">
            <CardHeader>
              <CardTitle>Startup Pitch Night</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[#00b0a6]">Date: April 30, 2025</p>
              <Button
                variant="outline"
                className="mt-4 w-full hover:bg-[#E1A913] hover:text-white"
              >
                Register
              </Button>
            </CardContent>
          </Card>

          {/* Card 4 */}
          <Card className="rounded-lg bg-[#072446] p-6 shadow-lg text-[#E1A913]">
            <CardHeader>
              <CardTitle>African's Youth Day 2025</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[#00b0a6]">Date: March 28, 2025</p>
              <Button
                variant="outline"
                className="mt-4 w-full hover:bg-[#E1A913] hover:text-white"
              >
                Register
              </Button>
            </CardContent>
          </Card>

          {/* Card 5 */}
          <Card className="rounded-lg bg-[#072446] p-6 shadow-lg text-[#E1A913]">
            <CardHeader>
              <CardTitle>YLT 2025</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[#00b0a6]">Date: April 30, 2025</p>
              <Button
                variant="outline"
                className="mt-4 w-full hover:bg-[#E1A913] hover:text-white"
              >
                Register
              </Button>
            </CardContent>
          </Card>

          {/* Card 6 */}
          <Card className="rounded-lg bg-[#072446] p-6 shadow-lg text-[#E1A913]">
            <CardHeader>
              <CardTitle>PSP 2025</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[#00b0a6]">Date: May 25, 2025</p>
              <Button
                variant="outline"
                className="mt-4 w-full hover:bg-[#E1A913] hover:text-white"
              >
                Register
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default EventsPage;
