"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
// import Link from "next/link";
import { Button } from "@/components/ui/button";
import { trpc } from "@/utils/trpc";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { Edit, Trash2, ArrowLeft, Calendar, Users } from "lucide-react";
import { useEventContext } from "@/context/event-context";

// Define type for event object
type Event = {
  _id: string | { toString(): string };
  title: string;
  date: string;
  location?: string;
  capacity?: number;
  description?: string;
  image?: string;
};

export default function EventsManagementPage() {
  const router = useRouter();
  const { userId, isSignedIn, isLoaded } = useAuth();
  const { lastUpdated } = useEventContext();
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);

  // Fetch all events
  const { data: events, isLoading, refetch } = trpc.event.getAll.useQuery();

  // Refetch events when lastUpdated changes
  useEffect(() => {
    if (lastUpdated) {
      console.log("Event updated, refetching events...", lastUpdated);
      void refetch();
    }
  }, [lastUpdated, refetch]);

  // Delete event mutation
  const deleteEventMutation = trpc.event.delete.useMutation({
    onSuccess: () => {
      toast.success("Event deleted successfully!");
      void refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete event: ${error.message}`);
    },
    onSettled: () => {
      setDeletingEventId(null);
    },
  });

  // Handle event deletion
  const handleDeleteEvent = (eventId: string) => {
    if (!isSignedIn || !userId) {
      toast.error("You must be signed in to delete events");
      return;
    }

    if (
      confirm(
        "Are you sure you want to delete this event? This action cannot be undone.",
      )
    ) {
      setDeletingEventId(eventId);
      deleteEventMutation.mutate({ id: eventId });
    }
  };

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
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-[#072446]">
            Event Management
          </h1>
          <div className="flex space-x-4">
            <Button
              onClick={() => router.push("/admin")}
              variant="outline"
              className="flex items-center space-x-2 border-[#072446] bg-white text-[#072446]"
            >
              <ArrowLeft size={16} />
              <span>Back to Admin</span>
            </Button>
            <Button
              onClick={() => router.push("/admin/registrations")}
              className="flex items-center space-x-2 bg-[#00b0a6] text-white hover:bg-[#009991]"
            >
              <Users size={16} />
              <span>View Registrations</span>
            </Button>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-lg">
          <h2 className="mb-6 text-2xl font-semibold text-[#072446]">
            All Events
          </h2>

          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <p className="text-gray-500">Loading events...</p>
            </div>
          ) : events && events.length > 0 ? (
            <div className="space-y-4">
              {events.map((event) => {
                // Type assertion for event object
                const typedEvent = event as Event;
                // Ensure we have a valid string ID
                const eventId =
                  typeof typedEvent._id === "string"
                    ? typedEvent._id
                    : typedEvent._id
                      ? (typedEvent._id as { toString(): string }).toString()
                      : `event-${Math.random().toString(36).substring(2, 9)}`;

                console.log("Event in list:", {
                  id: eventId,
                  title: typedEvent.title,
                });
                const isDeleting = deletingEventId === eventId;

                return (
                  <div
                    key={eventId}
                    className="flex flex-col rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md sm:flex-row sm:items-center"
                  >
                    <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-md">
                      <img
                        src={typedEvent.image ?? "/images/tech-conference.jpg"}
                        alt={typedEvent.title}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "/images/tech-conference.jpg";
                        }}
                      />
                    </div>

                    <div className="mt-4 flex-grow sm:ml-6 sm:mt-0">
                      <h3 className="text-lg font-medium text-[#072446]">
                        {typedEvent.title}
                      </h3>
                      <div className="mt-1 flex flex-wrap items-center text-sm text-gray-500">
                        <span className="mr-4 flex items-center">
                          <Calendar size={14} className="mr-1" />
                          {typedEvent.date}
                        </span>
                        <span className="mr-4">
                          Location: {typedEvent.location ?? "TBD"}
                        </span>
                        <span>Capacity: {typedEvent.capacity}</span>
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                        {typedEvent.description ?? "No description provided."}
                      </p>
                    </div>

                    <div className="mt-4 flex space-x-2 sm:ml-4 sm:mt-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center space-x-1 border-gray-300 text-gray-700"
                        onClick={() => {
                          console.log("Editing event with ID:", eventId);
                          router.push(`/admin/events/edit/${eventId}`);
                        }}
                      >
                        <Edit size={14} />
                        <span>Edit</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center space-x-1 border-red-300 text-red-600 hover:bg-red-50"
                        onClick={() => handleDeleteEvent(eventId)}
                        disabled={isDeleting}
                      >
                        {isDeleting ? (
                          <span>Deleting...</span>
                        ) : (
                          <>
                            <Trash2 size={14} />
                            <span>Delete</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex h-40 flex-col items-center justify-center space-y-4 rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
              <p className="text-gray-500">No events found.</p>
              <Button
                onClick={() => router.push("/admin")}
                className="bg-[#E1A913] text-white hover:bg-[#c99a0f]"
              >
                Create Your First Event
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
