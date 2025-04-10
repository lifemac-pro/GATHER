"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { trpc } from "@/utils/trpc";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";

export default function AdminPage() {
  const router = useRouter();
  const { userId, isSignedIn, isLoaded } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [image, setImage] = useState("/images/tech-conference.jpg"); // Default image
  const [capacity, setCapacity] = useState(100);
  
  // Available images
  const availableImages = [
    { src: "/images/tech-conference.jpg", label: "Tech Conference" },
    { src: "/images/startup-pitch.jpg", label: "Startup Pitch" },
    { src: "/images/ai-web3-summit.jpg", label: "AI Summit" },
    { src: "/images/psp-event.jpg", label: "PSP Event" },
    { src: "/images/ylt-event.jpg", label: "YLT Event" },
    { src: "/images/nornuvi-event.jpg", label: "NORNUVI Event" },
  ];
  
  // Create event mutation
  const createEvent = trpc.event.create.useMutation({
    onSuccess: () => {
      toast.success("Event created successfully!");
      resetForm();
      // Redirect to events list or stay on page
    },
    onError: (error) => {
      toast.error(`Failed to create event: ${error.message}`);
      setIsSubmitting(false);
    }
  });
  
  // Reset form
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDate("");
    setLocation("");
    setImage("/images/tech-conference.jpg");
    setCapacity(100);
    setIsSubmitting(false);
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isSignedIn || !userId) {
      toast.error("You must be signed in to create events");
      return;
    }
    
    setIsSubmitting(true);
    
    createEvent.mutate({
      title,
      description,
      date,
      location,
      image,
      capacity,
      createdBy: userId,
      attendees: [],
      createdAt: new Date(),
    });
  };
  
  // If not loaded yet, show loading state
  if (!isLoaded) {
    return <div className="p-8">Loading...</div>;
  }
  
  // If not signed in, show sign-in message
  if (!isSignedIn) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#6fc3f7] p-8">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
          <h1 className="mb-6 text-2xl font-bold text-[#072446]">Admin Access Required</h1>
          <p className="mb-4 text-gray-600">You need to sign in to access the admin panel.</p>
          <Button 
            onClick={() => router.push("/sign-in")}
            className="w-full bg-[#072446] text-white hover:bg-[#0a3060]"
          >
            Sign In
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[#6fc3f7] p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-[#072446]">Admin Dashboard</h1>
          <Button 
            onClick={() => router.push("/attendee/dashboard")}
            className="bg-[#072446] text-white hover:bg-[#0a3060]"
          >
            Back to Attendee Dashboard
          </Button>
        </div>
        
        <div className="rounded-lg bg-white p-6 shadow-lg">
          <h2 className="mb-6 text-2xl font-semibold text-[#072446]">Create New Event</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Event Title*
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2"
                required
              />
            </div>
            
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Description*
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2"
                rows={4}
                required
              />
            </div>
            
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Date*
                </label>
                <input
                  type="text"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  placeholder="e.g., March 30, 2025"
                  className="w-full rounded-md border border-gray-300 p-2"
                  required
                />
              </div>
              
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Location*
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Convention Center, New York"
                  className="w-full rounded-md border border-gray-300 p-2"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Capacity
                </label>
                <input
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(parseInt(e.target.value))}
                  min="1"
                  className="w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Event Image
                </label>
                <select
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="w-full rounded-md border border-gray-300 p-2"
                >
                  {availableImages.map((img) => (
                    <option key={img.src} value={img.src}>
                      {img.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="mt-4 flex justify-end space-x-4">
              <Button
                type="button"
                onClick={resetForm}
                variant="outline"
                className="border-gray-300 text-gray-700"
                disabled={isSubmitting}
              >
                Reset
              </Button>
              <Button
                type="submit"
                className="bg-[#E1A913] text-white hover:bg-[#c99a0f]"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating..." : "Create Event"}
              </Button>
            </div>
          </form>
        </div>
        
        {/* Event List Section - We'll add this later */}
        <div className="mt-8 rounded-lg bg-white p-6 shadow-lg">
          <h2 className="mb-6 text-2xl font-semibold text-[#072446]">Manage Events</h2>
          <p className="text-gray-600">
            Event management functionality will be added here.
          </p>
        </div>
        
        {/* Registrations Section - We'll add this later */}
        <div className="mt-8 rounded-lg bg-white p-6 shadow-lg">
          <h2 className="mb-6 text-2xl font-semibold text-[#072446]">Attendee Registrations</h2>
          <p className="text-gray-600">
            Registration management functionality will be added here.
          </p>
        </div>
      </div>
    </div>
  );
}
