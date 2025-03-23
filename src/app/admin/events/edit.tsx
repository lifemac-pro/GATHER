"use client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function EditEventPage() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get("id");

  const [eventName, setEventName] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");

  useEffect(() => {
    const fetchEvent = async () => {
      if (eventId) {
        const res = await fetch(`/api/events/${eventId}`);
        const data = await res.json();
        setEventName(data.eventName);
        setDate(data.date);
        setLocation(data.location);
      }
    };

    fetchEvent().catch(error => console.error("Error fetching event:", error)); // ✅ Handle errors
  }, [eventId]);
    

  const handleUpdateEvent = async () => {
    const response = await fetch(`/api/events/${eventId}`, {
      method: "PUT",
      body: JSON.stringify({ eventName, date, location }),
      headers: { "Content-Type": "application/json" },
    });

    if (response.ok) {
      alert("Event Updated Successfully!");
    } else {
      alert("Failed to update event.");
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-[#072446]">Edit Event</h1>

      <Input placeholder="Event Name" value={eventName} onChange={(e) => setEventName(e.target.value)} className="mt-4" />
      <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-4" />
      <Input placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} className="mt-4" />

      <Button onClick={handleUpdateEvent} className="mt-4 bg-[#00b0a6] text-white">
        Update Event
      </Button>
    </div>
  );
}
