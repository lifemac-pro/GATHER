"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function EventsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new events page under attendee layout
    router.replace("/attendee/events/browse");
  }, [router]);

  return (
    <div className="container flex min-h-[50vh] items-center justify-center">
      <LoadingSpinner size="lg" text="Redirecting to events..." />
    </div>
  );
}
