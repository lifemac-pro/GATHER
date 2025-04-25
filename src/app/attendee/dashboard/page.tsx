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

// Define type for Event
type Event = {
  _id: string | { toString(): string };
  title: string;
  date: string;
  location?: string;
  description?: string;
  image?: string;
  attendees?: string[];
  capacity?: number;
};

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
      void refetch();
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
  const isRegistered = (eventId: string, event: Event) => {
    if (!isSignedIn || !user) return false;

    // Check if user is in the event's attendees array
    if (event.attendees?.includes(user.id)) {
      return true;
    }

    // Check if user has a registration for this event
    if (userRegistrations) {
      return userRegistrations.some((reg) => {
        // Check if the registration has an event and if that event's ID matches
        return reg.event && reg.event._id === eventId;
      });
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
      <nav className="flex items-center justify-between bg-[#082865] p-4 shadow-md md:hidden">
        <h2 className="text-xl font-bold text-white">GatherEase</h2>
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
        className={`fixed inset-0 z-50 bg-black bg-opacity-70 backdrop-blur-sm transition-opacity duration-300 ${
          mobileMenuOpen ? "visible opacity-100" : "invisible opacity-0"
        }`}
        onClick={() => setMobileMenuOpen(false)}
      >
        <aside
          className={`fixed left-0 top-0 h-screen w-72 transform bg-gradient-to-b from-[#082865] to-[#004BD9] shadow-lg transition-transform duration-300 ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="absolute right-4 top-4 text-white/80 transition hover:text-white"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close Menu"
          >
            <X size={24} />
          </button>
          <Sidebar />
        </aside>
      </div>

      {/* Main Content */}
      <main className="flex-1 bg-gradient-to-b from-[#f0f9ff] to-[#e0f2fe] p-6">
        {/* Welcome Message */}
        <div className="mb-8 rounded-xl bg-gradient-to-r from-[#082865] to-[#0055FF] p-6 shadow-lg">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h1 className="text-2xl font-bold text-white md:text-3xl">
                Welcome, {user?.firstName || "Guest"}! 👋
              </h1>
              <p className="mt-1 text-white/80 md:text-base">
                Manage your event registrations and feedback.
              </p>
            </div>

            {/* Sign Out Button */}
            <div className="flex flex-wrap gap-2">
              <SignOutButton
                redirectUrl="/"
                className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white backdrop-blur-sm transition-all hover:bg-white/10"
              >
                Sign Out
              </SignOutButton>
            </div>
          </div>
        </div>

        {/* Upcoming Events Section */}
        <section className="rounded-xl bg-white p-6 shadow-md">
          <h2 className="text-xl font-bold text-[#082865] md:text-2xl">
            Events
          </h2>
          <p className="mt-1 text-gray-500">
            Browse and register for upcoming events
          </p>

          {isLoading ? (
            <div className="mt-8 flex h-40 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0055FF] border-t-transparent"></div>
            </div>
          ) : events && events.length > 0 ? (
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => {
                // Type assertion for event object
                const typedEvent = event as Event;

                const eventId =
                  typeof typedEvent._id === "string"
                    ? typedEvent._id
                    : (typedEvent._id as { toString(): string }).toString();
                const registered = isRegistered(eventId, typedEvent);

                return (
                  <EventCard
                    key={eventId}
                    id={eventId}
                    title={typedEvent.title}
                    date={typedEvent.date}
                    status={registered ? "Registered" : "Not Registered"}
                    image={typedEvent.image || "/images/tech-conference.jpg"}
                    onRegister={handleRegister}
                    isLoading={loadingEvent === eventId}
                  />
                );
              })}
            </div>
          ) : (
            <div className="mt-8 rounded-lg border border-gray-100 bg-gray-50 p-8 text-center">
              <p className="text-gray-500">
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
