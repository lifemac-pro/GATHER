"use client";

import React, { useState } from "react";
import Sidebar from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { trpc } from "@/utils/trpc";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";

const EventsPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isSignedIn } = useUser();

  // Track loading state for each event registration
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
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="sticky top-0 hidden h-screen md:block">
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
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="relative h-screen w-2/3 max-w-[280px] overflow-y-auto bg-[#072446] text-[#B0B8C5] shadow-lg">
            <button
              className="absolute right-4 top-4 text-white"
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
            className="h-screen flex-1 bg-black bg-opacity-50"
            onClick={() => setMobileMenuOpen(false)}
          ></div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 bg-[#6fc3f7] p-6">
        <h1 className="mb-6 text-2xl font-bold text-black md:text-3xl">
          Upcoming Events
        </h1>

        {isLoading ? (
          <div className="rounded-lg bg-white p-8 text-center shadow-md">
            <p className="text-gray-600">Loading events...</p>
          </div>
        ) : events && events.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <Card
                key={
                  typeof event._id === "string"
                    ? event._id
                    : event._id.toString()
                }
                className="overflow-hidden rounded-lg bg-[#072446] text-[#E1A913] shadow-lg"
              >
                <div className="relative h-40 w-full">
                  <img
                    src={event.image || "/images/tech-conference.jpg"}
                    alt={event.title}
                    className="h-full w-full rounded-t-lg object-cover"
                  />
                </div>

                <CardHeader className="p-4">
                  <CardTitle>{event.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <p className="text-[#00b0a6]">📅 {event.date}</p>
                  <p className="text-[#00b0a6]">📍 {event.location || "TBD"}</p>
                  <p className="mt-2 text-sm text-gray-300">
                    {event.description?.substring(0, 100)}
                    {event.description && event.description.length > 100
                      ? "..."
                      : ""}
                  </p>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm text-gray-400">
                      {event.attendees?.length || 0} / {event.capacity || 100}{" "}
                      registered
                    </span>

                    {isRegistered(
                      typeof event._id === "string"
                        ? event._id
                        : event._id.toString(),
                      event,
                    ) ? (
                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                        Registered
                      </span>
                    ) : (
                      <Button
                        variant="outline"
                        className={`mt-4 w-full ${
                          loadingEvent ===
                          (typeof event._id === "string"
                            ? event._id
                            : event._id.toString())
                            ? "cursor-not-allowed bg-gray-500"
                            : "bg-blue-600 hover:bg-blue-700"
                        }`}
                        disabled={
                          loadingEvent ===
                          (typeof event._id === "string"
                            ? event._id
                            : event._id.toString())
                        }
                        onClick={() =>
                          handleRegister(
                            typeof event._id === "string"
                              ? event._id
                              : event._id.toString(),
                          )
                        }
                      >
                        {loadingEvent ===
                        (typeof event._id === "string"
                          ? event._id
                          : event._id.toString())
                          ? "Registering..."
                          : "Register"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-lg bg-white p-8 text-center shadow-md">
            <p className="text-gray-600">No events available at the moment.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default EventsPage;
