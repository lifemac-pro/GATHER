"use client";

import React, { useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/ui/sidebar";
import EventCard from "@/components/ui/EventCard";
import { Menu, X } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { SignOutButton } from "@/components/ui/sign-out-button";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";

const Dashboard = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isSignedIn } = useUser();
  const [loadingEvent, setLoadingEvent] = useState<string | null>(null);

  // Fetch all events
  const { data: events, isLoading, refetch } = trpc.event.getAll.useQuery();

  // Fetch user registrations to check which events they're registered for
  const { data: userRegistrations } =
    trpc.registration.getUserRegistrations.useQuery(undefined, {
      enabled: !!isSignedIn,
    });

  // Register for event mutation
  const registerMutation = trpc.registration.register.useMutation({
    onSuccess: (data) => {
      if (data.alreadyRegistered) {
        toast.info("You are already registered for this event");
      } else {
        toast.success("Registration successful!");
      }
      refetch();
    },
    onError: (error) => {
      toast.error(`Registration failed: ${error.message}`);
    },
  });

  // Function to handle event registration
  const handleRegister = async (eventId: string) => {
    if (!isSignedIn || !user) {
      toast.error("You must be signed in to register for events");
      return;
    }

    if (loadingEvent === eventId) return; // Prevent duplicate requests
    setLoadingEvent(eventId);

    try {
      console.log("Registering for event with ID:", eventId);

      await registerMutation.mutateAsync({
        eventId,
        userId: user.id,
        userName: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
        userEmail: user.emailAddresses[0]?.emailAddress || "",
        notes: "",
      });

      console.log("Registration successful");
    } catch (error) {
      // Error is handled in the mutation callbacks
      console.error("Registration error:", error);
    } finally {
      setLoadingEvent(null); // Reset loading state
    }
  };

  // Check if user is registered for an event
  const isRegistered = (eventId: string, event: any) => {
    if (!isSignedIn || !user) return false;

    // Check if user is in the event's attendees array
    if (event.attendees && event.attendees.includes(user.id)) {
      return true;
    }

    // Check if user has a registration for this event
    if (userRegistrations) {
      return userRegistrations.some((reg) => reg.eventId === eventId);
    }

    return false;
  };

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

          {isLoading ? (
            <div className="mt-4 rounded-lg bg-white p-8 text-center shadow-md">
              <p className="text-gray-600">Loading events...</p>
            </div>
          ) : events && events.length > 0 ? (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => {
                const eventId =
                  typeof event._id === "string"
                    ? event._id
                    : event._id.toString();
                const registered = isRegistered(eventId, event);

                return (
                  <EventCard
                    key={eventId}
                    id={eventId}
                    title={event.title}
                    date={event.date}
                    status={registered ? "Registered" : "Not Registered"}
                    image={event.image || "/images/tech-conference.jpg"}
                    onRegister={handleRegister}
                    isLoading={loadingEvent === eventId}
                  />
                );
              })}
            </div>
          ) : (
            <div className="mt-4 rounded-lg bg-white p-8 text-center shadow-md">
              <p className="text-gray-600">
                No events available at the moment.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
