"use client";

import { Suspense } from "react";
import { EventsContent } from "@/components/events/events-content";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function EventsPage() {
  return (
    <Suspense fallback={
      <div className="container flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" text="Loading events..." />
      </div>
    }>
      <EventsContent />
    </Suspense>
  );
}
