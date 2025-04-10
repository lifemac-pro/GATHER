"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { trpc } from "@/utils/trpc";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export default function AdminRegistrationsPage() {
  const router = useRouter();
  const { userId, isSignedIn, isLoaded } = useAuth();
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Fetch all events
  const { data: events, isLoading: eventsLoading } =
    trpc.event.getAll.useQuery();

  // Fetch registrations for selected event
  const {
    data: registrations,
    isLoading: registrationsLoading,
    refetch: refetchRegistrations,
  } = trpc.registration.getEventRegistrations.useQuery(
    { eventId: selectedEventId || "" },
    {
      enabled: !!selectedEventId,
      onSuccess: (data) => {
        console.log("Registrations fetched:", data);
        if (data && data.length > 0) {
          console.log("Sample registration:", data[0]);
        } else {
          console.log("No registrations found");
        }
      },
      onError: (error) => {
        console.error("Error fetching registrations:", error);
        toast.error(`Error fetching registrations: ${error.message}`);
      },
      // Refetch every 5 seconds for testing
      refetchInterval: 5000,
    },
  );

  // If not loaded yet, show loading state
  if (!isLoaded) {
    return <div className="p-8">Loading...</div>;
  }

  // If not signed in, show sign-in message
  if (!isSignedIn) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#6fc3f7] p-8">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
          <h1 className="mb-6 text-2xl font-bold text-[#072446]">
            Admin Access Required
          </h1>
          <p className="mb-4 text-gray-600">
            You need to sign in to access the admin panel.
          </p>
          <Button
            onClick={() => router.push("/sign-in")}
            className="w-full bg-[#072446] text-white hover:bg-[#0a3060]"
          >
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#6fc3f7] p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-[#072446]">
            Event Registrations
          </h1>
          <div className="space-x-4">
            <Button
              onClick={() => router.push("/admin")}
              variant="outline"
              className="bg-white text-[#072446] hover:bg-gray-100"
            >
              Back to Admin Dashboard
            </Button>
            <Button
              onClick={() => router.push("/attendee/dashboard")}
              className="bg-[#072446] text-white hover:bg-[#0a3060]"
            >
              Attendee Dashboard
            </Button>
          </div>
        </div>

        {/* Event Selection */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow-lg">
          <h2 className="mb-4 text-xl font-semibold text-[#072446]">
            Select Event
          </h2>

          {eventsLoading ? (
            <p className="text-gray-600">Loading events...</p>
          ) : events && events.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <div
                  key={event._id.toString()}
                  className={`cursor-pointer rounded-lg border p-4 transition-colors ${
                    selectedEventId ===
                    (typeof event._id === "string"
                      ? event._id
                      : event._id.toString())
                      ? "border-[#E1A913] bg-[#072446] text-white"
                      : "border-gray-200 bg-gray-50 hover:border-[#E1A913]"
                  }`}
                  onClick={() => {
                    const eventId =
                      typeof event._id === "string"
                        ? event._id
                        : event._id.toString();
                    console.log("Selected event ID:", eventId);
                    setSelectedEventId(eventId);
                  }}
                >
                  <h3
                    className={`font-semibold ${
                      selectedEventId ===
                      (typeof event._id === "string"
                        ? event._id
                        : event._id.toString())
                        ? "text-[#E1A913]"
                        : "text-[#072446]"
                    }`}
                  >
                    {event.title}
                  </h3>
                  <p
                    className={`text-sm ${
                      selectedEventId ===
                      (typeof event._id === "string"
                        ? event._id
                        : event._id.toString())
                        ? "text-gray-300"
                        : "text-gray-600"
                    }`}
                  >
                    {event.date} • {event.attendees?.length || 0} registrations
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No events available.</p>
          )}
        </div>

        {/* Registrations Table */}
        {selectedEventId && (
          <div className="rounded-lg bg-white p-6 shadow-lg">
            <h2 className="mb-6 text-xl font-semibold text-[#072446]">
              Registrations
              {events?.find((e) => e._id.toString() === selectedEventId)
                ?.title &&
                ` for ${events.find((e) => e._id.toString() === selectedEventId)?.title}`}
            </h2>

            {registrationsLoading ? (
              <p className="text-gray-600">Loading registrations...</p>
            ) : registrations && registrations.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 text-left">
                      <th className="p-3 text-sm font-semibold text-gray-600">
                        Name
                      </th>
                      <th className="p-3 text-sm font-semibold text-gray-600">
                        Email
                      </th>
                      <th className="p-3 text-sm font-semibold text-gray-600">
                        Status
                      </th>
                      <th className="p-3 text-sm font-semibold text-gray-600">
                        Registered
                      </th>
                      <th className="p-3 text-sm font-semibold text-gray-600">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrations.map((registration) => (
                      <tr
                        key={registration._id.toString()}
                        className="border-b border-gray-200 hover:bg-gray-50"
                      >
                        <td className="p-3">{registration.userName}</td>
                        <td className="p-3">{registration.userEmail}</td>
                        <td className="p-3">
                          <span
                            className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
                              registration.status === "confirmed"
                                ? "bg-green-100 text-green-800"
                                : registration.status === "cancelled"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {registration.status.charAt(0).toUpperCase() +
                              registration.status.slice(1)}
                          </span>
                        </td>
                        <td className="p-3 text-sm text-gray-600">
                          {registration.registeredAt
                            ? formatDistanceToNow(
                                new Date(registration.registeredAt),
                                { addSuffix: true },
                              )
                            : "Unknown date"}
                        </td>
                        <td className="p-3 text-sm text-gray-600">
                          {registration.notes || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-600">
                No registrations found for this event.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
