"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/trpc/react';
import { EventCard } from './event-card';

export function EventList() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = api.event.getAll.useQuery();

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  if (isLoading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-[350px] animate-pulse rounded-lg bg-muted"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center text-destructive">
        Error loading events: {error.message}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-lg border border-muted p-8 text-center">
        <h3 className="mb-2 text-lg font-semibold">No events found</h3>
        <p className="text-muted-foreground">
          There are no events available at the moment.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {data.map((event) => (
          <EventCard
            key={event.id}
            id={event.id}
            name={event.name}
            description={event.description}
            location={event.location}
            startDate={new Date(event.startDate)}
            endDate={new Date(event.endDate)}
            category={event.category}
            price={event.price}
            image={event.image}
            attendeeCount={event.attendees?.length}
          />
        ))}
      </div>

      {data.length > 0 && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => handlePageChange(page + 1)}
            className="mx-auto"
          >
            Load More Events
          </Button>
        </div>
      )}
    </div>
  );
}
