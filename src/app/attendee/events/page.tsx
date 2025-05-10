"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/trpc/react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EventCard } from "@/components/ui/attendee/event-card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search, Calendar, CalendarX } from "lucide-react";

export default function AttendeeEventsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch upcoming events for the user
  const { data: upcomingEvents, isLoading: isUpcomingLoading, error: upcomingError } =
    api.attendee.getUpcomingEvents.useQuery(
      undefined,
      {
        enabled: isLoaded && !!user,
        retry: 3,
        onError: (error) => {
          console.error("Error fetching upcoming events:", error);
        }
      }
    );

  // Fetch past events for the user
  const { data: pastEvents, isLoading: isPastLoading, error: pastError } =
    api.attendee.getPastEvents.useQuery(
      undefined,
      {
        enabled: isLoaded && !!user,
        retry: 3,
        onError: (error) => {
          console.error("Error fetching past events:", error);
        }
      }
    );

  const isLoading = !isLoaded || isUpcomingLoading || isPastLoading;
  const hasError = upcomingError || pastError;

  if (isLoading) {
    return (
      <div className="container flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" text="Loading events..." />
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="container flex min-h-[50vh] flex-col items-center justify-center space-y-4">
        <h2 className="text-xl font-semibold text-red-600">Error loading events</h2>
        <p className="text-muted-foreground">
          {upcomingError?.message || pastError?.message || "Please try again later"}
        </p>
        <Button onClick={() => router.refresh()}>Retry</Button>
      </div>
    );
  }

  // Filter events based on search query
  const filterEvents = (events: any[] | undefined) => {
    if (!events) return [];
    if (!searchQuery.trim()) return events;

    return events.filter(event =>
      event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (event.location && event.location.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  };

  const filteredUpcomingEvents = filterEvents(upcomingEvents);
  const filteredPastEvents = filterEvents(pastEvents);

  return (
    <div className="container space-y-8 py-8">
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <h1 className="text-3xl font-bold">My Events</h1>
        <div className="flex w-full items-center space-x-2 sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            onClick={() => router.push("/attendee/events/browse")}
            className="whitespace-nowrap"
          >
            Browse Events
          </Button>
        </div>
      </div>

      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upcoming" className="space-x-2">
            <Calendar className="h-4 w-4" />
            <span>Upcoming</span>
          </TabsTrigger>
          <TabsTrigger value="past" className="space-x-2">
            <CalendarX className="h-4 w-4" />
            <span>Past</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-6">
          {filteredUpcomingEvents && filteredUpcomingEvents.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredUpcomingEvents.map((event) => (
                <EventCard
                  key={event.id}
                  id={event.id}
                  name={event.name}
                  startDate={new Date(event.startDate)}
                  endDate={event.endDate ? new Date(event.endDate) : undefined}
                  location={event.location}
                  status={event.status}
                  onClick={() => router.push(`/events/${event.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <h3 className="mb-2 text-lg font-semibold">No upcoming events</h3>
              <p className="text-muted-foreground">
                You don't have any upcoming events. Browse events to register.
              </p>
              <Button
                onClick={() => router.push("/events")}
                className="mt-4 bg-[#00b0a6] text-white hover:bg-[#00b0a6]/90"
              >
                Browse Events
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-6">
          {filteredPastEvents && filteredPastEvents.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredPastEvents.map((event) => (
                <EventCard
                  key={event.id}
                  id={event.id}
                  name={event.name}
                  startDate={new Date(event.startDate)}
                  endDate={event.endDate ? new Date(event.endDate) : undefined}
                  location={event.location}
                  status={event.status}
                  onClick={() => router.push(`/events/${event.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <h3 className="mb-2 text-lg font-semibold">No past events</h3>
              <p className="text-muted-foreground">
                You haven't attended any events yet.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
