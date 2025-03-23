"use client";
import { Input } from "@/components/ui/input";
//import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function CreateEventPage() {
  const [eventName, setEventName] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState("Upcoming");

  const handleCreateEvent = async () => {
    console.log("Creating event:", { eventName, date, location, status });

    const response = await fetch("/api/events", {
      method: "POST",
      body: JSON.stringify({ eventName, date, location, status }),
      headers: { "Content-Type": "application/json" },
    });

    if (response.ok) {
      alert("Event Created Successfully!");
    } else {
      alert("Failed to create event.");
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-[#072446]">Create Event</h1>

      <Input placeholder="Event Name" value={eventName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEventName(e.target.value)} className="mt-4" />
      <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-4" />
      <Input placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} className="mt-4" />

      <Select onValueChange={setStatus} defaultValue="Upcoming">
        <SelectTrigger className="mt-4">
          <SelectValue placeholder="Select Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Upcoming">Upcoming</SelectItem>
          <SelectItem value="Ongoing">Ongoing</SelectItem>
          <SelectItem value="Completed">Completed</SelectItem>
        </SelectContent>
      </Select>

      <Button onClick={handleCreateEvent} className="mt-4 bg-[#00b0a6] text-white">
        Create Event
      </Button>
    </div>
  );
}
