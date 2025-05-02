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
  const { data: upcomingEvents, isLoading: isUpcomingLoading } = 
    api.attendee.getUpcomingEvents.useQuery(
      undefined,
      { enabled: isLoaded && !!user }
    );

  // Fetch past events for the user
  const { data: pastEvents, isLoading: isPastLoading } = 
    api.attendee.getPastEvents.useQuery(
      undefined,
      { enabled: isLoaded && !!user }
    );

  const isLoading = !isLoaded || isUpcomingLoading || isPastLoading;

  if (isLoading) {
    return (
      <div className="container flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" text="Loading events..." />
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
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="text-3xl font-bold text-foreground">My Events</h1>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search events..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="upcoming" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Upcoming
          </TabsTrigger>
          <TabsTrigger value="past" className="flex items-center gap-2">
            <CalendarX className="h-4 w-4" />
            Past
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="upcoming" className="space-y-6">
          {filteredUpcomingEvents.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredUpcomingEvents.map((event) => (
                <EventCard
                  key={event.id}
                  id={event.id}
                  name={event.name}
                  startDate={new Date(event.startDate)}
                  endDate={event.endDate ? new Date(event.endDate) : undefined}
                  startTime={event.startTime}
                  endTime={event.endTime}
                  location={event.location}
                  status={event.status}
                  onClick={() => router.push(`/events/${event.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <h3 className="mb-2 text-lg font-semibold">No upcoming events</h3>
              <p className="mb-4 text-muted-foreground">
                You don't have any upcoming events. Browse events to register.
              </p>
              <Button 
                onClick={() => router.push("/events")}
                className="bg-[#00b0a6] text-white hover:bg-[#00b0a6]/90"
              >
                Browse Events
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="past" className="space-y-6">
          {filteredPastEvents.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredPastEvents.map((event) => (
                <EventCard
                  key={event.id}
                  id={event.id}
                  name={event.name}
                  startDate={new Date(event.startDate)}
                  endDate={event.endDate ? new Date(event.endDate) : undefined}
                  startTime={event.startTime}
                  endTime={event.endTime}
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
