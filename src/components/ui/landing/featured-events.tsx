"use client";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { EventImage } from "@/components/events/event-image";
import { api } from "@/trpc/react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export function FeaturedEvents() {
  // Fetch featured events from the API
  const { data: events, isLoading, error } = api.event.getFeatured.useQuery();

  // Show loading state
  if (isLoading) {
    return (
      <section className="bg-accent px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center text-3xl font-bold text-primary md:text-4xl">
            Upcoming Events
          </h2>
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" text="Loading events..." />
          </div>
        </div>
      </section>
    );
  }

  // Show error state
  if (error) {
    return (
      <section className="bg-accent px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center text-3xl font-bold text-primary md:text-4xl">
            Upcoming Events
          </h2>
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center text-destructive">
            Error loading events: {error.message}
          </div>
        </div>
      </section>
    );
  }

  // Show empty state
  if (!events || events.length === 0) {
    return (
      <section className="bg-accent px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center text-3xl font-bold text-primary md:text-4xl">
            Upcoming Events
          </h2>
          <div className="rounded-lg border border-muted p-8 text-center">
            <h3 className="mb-2 text-lg font-semibold">No events found</h3>
            <p className="text-muted-foreground">
              There are no featured events available at the moment.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-accent px-4 py-16">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-12 text-center text-3xl font-bold text-primary md:text-4xl">
          Upcoming Events
        </h2>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <Card
              key={event.id}
              className="overflow-hidden border-primary/20 bg-card transition-all duration-200 hover:border-primary/40"
            >
              <EventImage src={event.image} alt={event.name} />
              <CardHeader>
                <h3 className="text-xl font-bold text-primary">{event.name}</h3>
              </CardHeader>
              <CardContent className="space-y-2 text-card-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span>
                    {format(event.startDate, "MMM d, yyyy 'at' h:mm a")}
                  </span>
                </div>
                {event.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>{event.location}</span>
                  </div>
                )}
                <p className="mt-4 line-clamp-2">{event.description}</p>
              </CardContent>
              <CardFooter>
                <Link href={`/events/${event.id}`} className="w-full">
                  <Button
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    size="lg"
                  >
                    View Details
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link href="/events">
            <Button
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
              size="lg"
            >
              View All Events
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
