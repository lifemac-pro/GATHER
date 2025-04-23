"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function DebugEventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log("Fetching events from /api/events/all");
      const response = await fetch("/api/events/all");

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();
      console.log("API response:", data);

      if (Array.isArray(data)) {
        setEvents(data);
      } else {
        console.error("Unexpected data format:", data);
        setError("Unexpected data format from API");
        setEvents([]);
      }
    } catch (err) {
      console.error("Error fetching events:", err);
      setError(err instanceof Error ? err.message : String(err));
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-4 text-3xl font-bold">Debug Events Page</h1>

      <div className="mb-4">
        <Button onClick={fetchEvents} disabled={loading}>
          {loading ? "Loading..." : "Refresh Events"}
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
          <p>Error: {error}</p>
        </div>
      )}

      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold">Events ({events.length})</h2>

        {loading ? (
          <p>Loading events...</p>
        ) : events.length === 0 ? (
          <p>No events found.</p>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.id} className="rounded border p-4">
                <h3 className="text-lg font-medium">{event.name}</h3>
                <p className="text-sm text-gray-500">ID: {event.id}</p>
                <p className="text-sm text-gray-500">
                  Category: {event.category}
                </p>
                <p className="text-sm text-gray-500">
                  Start Date: {new Date(event.startDate).toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">
                  Created By: {event.createdById}
                </p>
                {event.description && (
                  <p className="mt-2">{event.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
