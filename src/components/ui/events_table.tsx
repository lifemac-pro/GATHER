"use client";
import {   Table,
  TableHeader,
  TableBody,
  
  TableHead,
  TableRow,
  TableCell,
   } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState, useEffect } from "react";


export default function EventsTable() {
  interface Event {
    id: string;
    eventName: string;
    date: string;
    location: string;
  }

  const [events, setEvents] = useState<Event[]>([]);
  const [search, setSearch] = useState(""); // 🔍 Search state

  useEffect(() => {
    const fetchEvents = async () => {
      const res = await fetch("/api/events");
      const data = await res.json();
      setEvents(data);
    };
    fetchEvents();
  }, []);

  // 🔍 Filter events based on search input
  const filteredEvents = events.filter((event) =>
    event.eventName.toLowerCase().includes(search.toLowerCase()) ||
    event.date.toLowerCase().includes(search.toLowerCase()) ||
    event.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="overflow-x-auto space-y-4">
      {/* 🔍 Search Input */}
      <input
        type="text"
        placeholder="Search events..."
        className="p-2 border rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <Table className="min-w-full">
        {/* <TableHeader>
          <TableRow>
            <TableHead>Event Name</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader> */}
        <TableBody>
          {filteredEvents.length > 0 ? (
            filteredEvents.map((event) => (
              <TableRow key={event.id}>
                <TableCell>{event.eventName}</TableCell>
                <TableCell>{event.date}</TableCell>
                <TableCell>{event.location}</TableCell>
                <TableCell className="whitespace-nowrap flex flex-wrap gap-2">
                  <Link href={`/dashboard/events/edit?id=${event.id}`}>
                    <Button variant="outline" size="sm">Edit</Button>
                  </Link>
                  <Link href={`/dashboard/events/delete?id=${event.id}`}>
                    <Button variant="destructive" size="sm">Delete</Button>
                  </Link>
                  <Link href={`/admin/events/${event.id}`}>
  <button className="bg-blue-500 text-white px-4 py-2 rounded">View</button>
</Link>

                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                No events found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
