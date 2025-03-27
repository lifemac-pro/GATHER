"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function CreateEventForm({ onCreate }: { onCreate: (event: any) => void }) {
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    time: "",
    location: "",
    image: null as File | null, // Store file object
    attendees: [],
  });

  // Handle text input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle file input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, image: e.target.files[0] }); // Store selected file
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.date || !formData.time || !formData.location || !formData.image) {
      alert("Please fill in all required fields, including an image!");
      return;
    }

    // Create form data object for submission (if sending to backend)
    const eventData = new FormData();
    eventData.append("title", formData.title);
    eventData.append("date", formData.date);
    eventData.append("time", formData.time);
    eventData.append("location", formData.location);
    eventData.append("image", formData.image);
    
    onCreate(eventData); // Pass data to parent component

    // Reset form
    setFormData({ title: "", date: "", time: "", location: "", image: null, attendees: [] });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md max-w-lg mx-auto">
      <h2 className="text-2xl font-bold mb-4">Create New Event</h2>

      <input type="text" name="title" placeholder="Event Title" value={formData.title} onChange={handleChange} className="w-full p-2 border mb-3" required />
      <input type="date" name="date" value={formData.date} onChange={handleChange} className="w-full p-2 border mb-3" required />
      <input type="time" name="time" value={formData.time} onChange={handleChange} className="w-full p-2 border mb-3" required />
      <input type="text" name="location" placeholder="Location" value={formData.location} onChange={handleChange} className="w-full p-2 border mb-3" required />

      {/* ✅ Image Upload (Required) */}
      <input type="file" name="image" accept="image/*" onChange={handleFileChange} className="w-full p-2 border mb-3" required />

      <Button type="submit" className="bg-[#00b0a6] text-white w-full">Create Event</Button>
    </form>
  );
}
