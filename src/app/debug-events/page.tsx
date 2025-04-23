"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function DebugEventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log("Fetching events directly from MongoDB...");
      const response = await fetch("/api/direct-events");

      if (!response.ok) {
        throw new Error(
          `API returned ${response.status}: ${await response.text()}`,
        );
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

  const createTestEvent = async () => {
    setCreating(true);
    setError(null);
    setMessage(null);

    try {
      console.log("Creating test event...");
      const response = await fetch("/api/create-test-event");

      if (!response.ok) {
        throw new Error(
          `API returned ${response.status}: ${await response.text()}`,
        );
      }

      const data = await response.json();
      console.log("API response:", data);

      setMessage("Test event created successfully!");

      // Refresh events list
      fetchEvents();
    } catch (err) {
      console.error("Error creating test event:", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-4 text-3xl font-bold">Debug Events Page</h1>

      <div className="mb-4 flex gap-2">
        <Button onClick={fetchEvents} disabled={loading}>
          {loading ? "Loading..." : "Refresh Events"}
        </Button>
        <Button onClick={createTestEvent} disabled={creating} variant="outline">
          {creating ? "Creating..." : "Create Test Event"}
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
          <p>Error: {error}</p>
        </div>
      )}

      {message && (
        <div className="mb-4 rounded border border-green-400 bg-green-100 px-4 py-3 text-green-700">
          <p>{message}</p>
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
            {events.map((event, index) => (
              <div key={event.id || index} className="rounded border p-4">
                <h3 className="text-lg font-medium">
                  {event.name || "Unnamed Event"}
                </h3>
                <p className="text-sm text-gray-500">
                  ID: {event.id || "No ID"}
                </p>
                <p className="text-sm text-gray-500">
                  Category: {event.category || "No Category"}
                </p>
                <p className="text-sm text-gray-500">
                  Start Date:{" "}
                  {event.startDate
                    ? new Date(event.startDate).toLocaleString()
                    : "No Date"}
                </p>
                <p className="text-sm text-gray-500">
                  Created By: {event.createdById || "Unknown"}
                </p>
                {event.description && (
                  <p className="mt-2">{event.description}</p>
                )}
                <pre className="mt-2 overflow-auto rounded bg-gray-100 p-2 text-xs">
                  {JSON.stringify(event, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
