"use client";

import React from "react";
import { trpc } from "@/utils/trpc";
import LandingEventCard from "./LandingEventCard";
import { useUser } from "@clerk/nextjs";

export default function FeaturedEvents() {
  const { data: events, isLoading } = trpc.event.getAll.useQuery();
  const { isSignedIn } = useUser();

  // Fetch user registrations to check which events they're registered for
  const { data: userRegistrations } =
    trpc.registration.getUserRegistrations.useQuery(undefined, {
      enabled: !!isSignedIn,
    });

  // Check if user is registered for an event
  const isRegistered = (eventId: string, event: any) => {
    if (!isSignedIn) return false;

    // Check if user is in the event's attendees array
    const user = window.Clerk?.user;
    if (event.attendees && user && event.attendees.includes(user.id)) {
      return true;
    }

    // Check if user has a registration for this event
    if (userRegistrations) {
      return userRegistrations.some((reg) => reg.eventId === eventId);
    }

    return false;
  };

  if (isLoading) {
    return (
      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        {[1, 2, 3].map((_, index) => (
          <div
            key={index}
            className="h-80 animate-pulse rounded-lg bg-gray-300"
          ></div>
        ))}
      </div>
    );
  }

  // If no events, show placeholder
  if (!events || events.length === 0) {
    return (
      <div className="mt-8 rounded-lg bg-white p-6 text-center">
        <p className="text-gray-600">No events available at the moment.</p>
      </div>
    );
  }

  // Show up to 3 featured events
  const featuredEvents = events.slice(0, 3);

  return (
    <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
      {featuredEvents.map((event) => (
        <LandingEventCard
          key={typeof event._id === "string" ? event._id : event._id.toString()}
          title={event.title}
          date={`📅 ${event.date}`}
          status={
            isRegistered(
              typeof event._id === "string" ? event._id : event._id.toString(),
              event,
            )
              ? "Registered"
              : "Not Registered"
          }
          image={event.image || "/images/tech-conference.jpg"}
        />
      ))}
    </div>
  );
}
