"use client";

import React from "react";
import { trpc } from "@/utils/trpc";
import LandingEventCard from "./LandingEventCard";
import { useUser } from "@clerk/nextjs";

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

// Add Clerk to the Window interface
declare global {
  interface Window {
    Clerk?: {
      user?: {
        id: string;
      };
    };
  }
}

export default function FeaturedEvents() {
  const { data: events, isLoading } = trpc.event.getAll.useQuery();
  const { isSignedIn } = useUser();

  // Fetch user registrations to check which events they're registered for
  const { data: userRegistrations } =
    trpc.registration.getUserRegistrations.useQuery(undefined, {
      enabled: !!isSignedIn,
    });

  // Check if user is registered for an event
  const isRegistered = (eventId: string, event: Event) => {
    if (!isSignedIn) return false;

    // Check if user is in the event's attendees array
    const user = window.Clerk?.user;
    if (event.attendees && user && event.attendees.includes(user.id)) {
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
      {featuredEvents.map((event) => {
        // Type assertion for event object
        const typedEvent = event as Event;

        return (
          <LandingEventCard
            key={
              typeof typedEvent._id === "string"
                ? typedEvent._id
                : (typedEvent._id as { toString(): string }).toString()
            }
            title={typedEvent.title}
            date={`📅 ${typedEvent.date}`}
            status={
              isRegistered(
                typeof typedEvent._id === "string"
                  ? typedEvent._id
                  : (typedEvent._id as { toString(): string }).toString(),
                typedEvent,
              )
                ? "Registered"
                : "Not Registered"
            }
            image={typedEvent.image ?? "/images/tech-conference.jpg"}
          />
        );
      })}
    </div>
  );
}
