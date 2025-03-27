"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/ui/sidebar";
import AttendeesTable from "@/components/ui/attendees-table";
import { Button } from "@/components/ui/button";

const ITEMS_PER_PAGE = 10; // Number of attendees per page

export default function AttendeesPage() {
  const [selectedEvent, setSelectedEvent] = useState("");
  const [attendees, setAttendees] = useState([]); // Store attendees
  const [totalAttendees, setTotalAttendees] = useState(0); // Store total count
  const [currentPage, setCurrentPage] = useState(1); // Current page number
  const [loading, setLoading] = useState(false); // Loading state

  // Sample event data
  const events = [
    { id: "event1", name: "Tech Conference 2025" },
    { id: "event2", name: "AI Summit" },
  ];

  // Fetch attendees based on page & selected event
  useEffect(() => {
    const fetchAttendees = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/attendees?page=${currentPage}&limit=${ITEMS_PER_PAGE}&event=${selectedEvent}`
        );
        const data = await response.json();

        setAttendees(data.attendees);
        setTotalAttendees(data.total);
      } catch (error) {
        console.error("Error fetching attendees:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendees();
  }, [currentPage, selectedEvent]);

  // Calculate total pages
  const totalPages = Math.ceil(totalAttendees / ITEMS_PER_PAGE);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-grow p-6 bg-[#F8FAFC]">
        <h1 className="text-3xl font-bold text-[#072446] mb-4">Manage Attendees</h1>

        {/* Event Filter Dropdown */}
        <div className="mb-4">
          <label className="block text-lg font-semibold mb-2">Filter by Event:</label>
          <select
            value={selectedEvent}
            onChange={(e) => {
              setSelectedEvent(e.target.value);
              setCurrentPage(1); // Reset to page 1 when event changes
            }}
            className="border p-2 rounded-lg w-full md:w-64"
          >
            <option value="">All Events</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name}
              </option>
            ))}
          </select>
        </div>

        {/* Attendees Table */}
        {loading ? (
          <p className="text-center">Loading attendees...</p>
        ) : (
          <AttendeesTable selectedEvent={selectedEvent} />
        )}

        {/* Pagination Controls */}
        <div className="flex justify-between items-center mt-6">
          <Button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="bg-gray-500 text-white px-4 py-2 rounded-md"
          >
            Previous
          </Button>

          <span className="text-gray-700">
            Page {currentPage} of {totalPages || 1}
          </span>

          <Button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage >= totalPages}
            className="bg-gray-500 text-white px-4 py-2 rounded-md"
          >
            Next
          </Button>
        </div>
      </main>
    </div>
  );
}
