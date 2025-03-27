"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "@/components/ui/sidebar";
import EventsTable from "@/components/ui/events_table";
import EventCard from "@/components/ui/EventCard";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import CreateEventForm from "@/components/ui/CreateEventForm";

// Mock event data
const initialEventData = [
  {
    id: "1",
    title: "Tech Conference 2025",
    date: "June 15, 2025",
    time: "10:00 AM - 3:00 PM",
    location: "New York City",
    image: "/images/tech-conference.jpg",
    attendees: [
      { id: 1, name: "Alice Johnson", email: "alice@example.com", phone: "+123456789" },
      { id: 2, name: "Michael Smith", email: "michael@example.com", phone: "+987654321" },
    ],
  },
  {
    id: "2",
    title: "Startup Pitch Night",
    date: "July 5, 2025",
    time: "6:00 PM - 9:00 PM",
    location: "San Francisco",
    image: "/images/pitch-night.jpg",
    attendees: [
      { id: 3, name: "Sarah Lee", email: "sarah@example.com", phone: "+112233445" },
    ],
  },
  {
    id: "3",
    title: "Networking Meetup",
    date: "August 12, 2025",
    time: "5:30 PM - 8:30 PM",
    location: "Los Angeles",
    image: "/images/networking.jpg",
    attendees: [],
  },
];

export default function EventsPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id"); // ✅ Get event ID from URL query params

  // State for managing events
  const [events, setEvents] = useState(initialEventData);
  const [event, setEvent] = useState<{
    id: string;
    title: string;
    date: string;
    time: string;
    location: string;
    image: string;
    attendees: { id: number; name: string; email: string; phone: string }[];
  } | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Load event details if `id` is present
  useEffect(() => {
    if (id) {
      const selectedEvent = events.find((e) => e.id === id);
      setEvent(selectedEvent || null);
    }
  }, [id, events]);

  function handleCreateEvent(newEvent: {
    id: string;
    title: string;
    date: string;
    time: string;
    location: string;
    image: string;
    attendees: { id: number; name: string; email: string; phone: string }[];
  }) {
    setEvents((prevEvents) => [...prevEvents, newEvent]);
    setShowCreateForm(false); // Close form after event creation
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-grow p-6 bg-[#F8FAFC]">
        {id && event ? (
          <>
            <h1 className="text-3xl font-bold text-[#072446]">{event.title}</h1>
            <p className="text-gray-600 mt-2">{event.date} • {event.time}</p>
            <p className="text-gray-500">{event.location}</p>

            {/* Event Summary */}
            <div className="bg-white shadow-md rounded-lg p-4 mt-6">
              <h2 className="text-xl font-bold mb-4">Event Summary</h2>
              <p><strong>Date:</strong> {event.date}</p>
              <p><strong>Time:</strong> {event.time}</p>
              <p><strong>Location:</strong> {event.location}</p>
              <p><strong>Total Registered Attendees:</strong> {event.attendees.length}</p>
            </div>

            {/* Attendees List */}
            <div className="bg-white shadow-md rounded-lg p-4 mt-6">
              <h2 className="text-xl font-bold mb-4">Registered Attendees</h2>
              {event.attendees.length > 0 ? (
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 p-2">Name</th>
                      <th className="border border-gray-300 p-2">Email</th>
                      <th className="border border-gray-300 p-2">Phone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {event.attendees.map((attendee) => (
                      <tr key={attendee.id}>
                        <td className="border border-gray-300 p-2">{attendee.name}</td>
                        <td className="border border-gray-300 p-2">{attendee.email}</td>
                        <td className="border border-gray-300 p-2">{attendee.phone}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-gray-500">No attendees registered yet.</p>
              )}
            </div>

            {/* Back to Events Button */}
            <div className="mt-6">
              <Button className="bg-gray-500 text-white" onClick={() => window.history.back()}>
                ← Back to Events
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Events Header */}
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-[#072446]">Manage Events</h1>
              <Button className="bg-[#00b0a6] text-white" onClick={() => setShowCreateForm(true)}>
                + Create Event
              </Button>
            </div>

            {/* Create Event Form */}
            {showCreateForm ? (
              <CreateEventForm onCreate={handleCreateEvent} />
            ) : (
              <>
                {/* Event Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-6">
                  {events.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>

                {/* Events Table */}
                <EventsTable />
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
