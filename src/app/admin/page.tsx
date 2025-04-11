"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { trpc } from "@/utils/trpc";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import {
  Upload,
  ChevronRight,
  Users,
  Calendar,
  Bell,
  ClipboardList,
} from "lucide-react";

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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Available images
  const availableImages = [
    { src: "/images/tech-conference.jpg", label: "Tech Conference" },
    { src: "/images/startup-pitch.jpg", label: "Startup Pitch" },
    { src: "/images/ai-web3-summit.jpg", label: "AI Summit" },
    { src: "/images/psp-event.jpg", label: "PSP Event" },
    { src: "/images/ylt-event.jpg", label: "YLT Event" },
    { src: "/images/nornuvi-event.jpg", label: "NORNUVI Event" },
  ];

  // Handle image file selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);

    // Create a preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

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
    },
  });

  // Reset form
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDate("");
    setLocation("");
    setImage("/images/tech-conference.jpg");
    setCapacity(100);
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setIsSubmitting(false);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isSignedIn || !userId) {
      toast.error("You must be signed in to create events");
      return;
    }

    setIsSubmitting(true);

    // Use the image preview URL if available, otherwise use the selected image
    const finalImageUrl = imagePreview ?? image;

    try {
      await createEvent.mutateAsync({
        title,
        description,
        date,
        location,
        image: finalImageUrl,
        capacity,
        createdBy: userId,
        attendees: [],
        createdAt: new Date(),
      });
    } catch (error) {
      console.error("Error creating event:", error);
    }
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
          <h1 className="mb-6 text-2xl font-bold text-[#072446]">
            Admin Access Required
          </h1>
          <p className="mb-4 text-gray-600">
            You need to sign in to access the admin panel.
          </p>
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
          <h2 className="mb-6 text-2xl font-semibold text-[#072446]">
            Create New Event
          </h2>

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
                <div className="space-y-2">
                  {/* Image upload */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      ref={fileInputRef}
                      className="hidden"
                      id="image-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center space-x-2"
                    >
                      <Upload size={16} />
                      <span>Upload Image</span>
                    </Button>
                    {imageFile && (
                      <span className="text-sm text-gray-500">
                        {imageFile.name}
                      </span>
                    )}
                  </div>

                  {/* Image preview */}
                  {imagePreview ? (
                    <div className="mt-2">
                      <p className="mb-1 text-sm text-gray-500">Preview:</p>
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="h-40 w-full rounded-md object-cover"
                      />
                    </div>
                  ) : (
                    <div>
                      <p className="mb-1 text-sm text-gray-500">
                        Or select from available images:
                      </p>
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
                  )}
                </div>
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

        {/* Event Management Section */}
        <div className="mt-8 rounded-lg bg-white p-6 shadow-lg">
          <h2 className="mb-6 text-2xl font-semibold text-[#072446]">
            Manage Events
          </h2>

          <div className="space-y-4">
            <Link
              href="/admin/events"
              className="flex items-center justify-between rounded-lg border border-gray-200 p-4 transition hover:bg-gray-50"
            >
              <div className="flex items-center space-x-3">
                <Calendar className="h-6 w-6 text-[#E1A913]" />
                <div>
                  <h3 className="font-medium text-[#072446]">
                    Event Management
                  </h3>
                  <p className="text-sm text-gray-500">
                    View, edit, and delete events
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </Link>
          </div>
        </div>

        {/* Registrations Section */}
        <div className="mt-8 rounded-lg bg-white p-6 shadow-lg">
          <h2 className="mb-6 text-2xl font-semibold text-[#072446]">
            Attendee Registrations
          </h2>

          <div className="space-y-4">
            <Link
              href="/admin/registrations"
              className="flex items-center justify-between rounded-lg border border-gray-200 p-4 transition hover:bg-gray-50"
            >
              <div className="flex items-center space-x-3">
                <Users className="h-6 w-6 text-[#00b0a6]" />
                <div>
                  <h3 className="font-medium text-[#072446]">
                    Registration Tracking
                  </h3>
                  <p className="text-sm text-gray-500">
                    View and manage event registrations
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </Link>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="mt-8 rounded-lg bg-white p-6 shadow-lg">
          <h2 className="mb-6 text-2xl font-semibold text-[#072446]">
            Attendee Communications
          </h2>

          <div className="space-y-4">
            <Link
              href="/admin/notifications"
              className="flex items-center justify-between rounded-lg border border-gray-200 p-4 transition hover:bg-gray-50"
            >
              <div className="flex items-center space-x-3">
                <Bell className="h-6 w-6 text-[#E1A913]" />
                <div>
                  <h3 className="font-medium text-[#072446]">
                    Send Notifications
                  </h3>
                  <p className="text-sm text-gray-500">
                    Create and manage attendee notifications
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </Link>
          </div>
        </div>

        {/* Surveys Section */}
        <div className="mt-8 rounded-lg bg-white p-6 shadow-lg">
          <h2 className="mb-6 text-2xl font-semibold text-[#072446]">
            Surveys & Feedback
          </h2>

          <div className="space-y-4">
            <Link
              href="/admin/surveys"
              className="flex items-center justify-between rounded-lg border border-gray-200 p-4 transition hover:bg-gray-50"
            >
              <div className="flex items-center space-x-3">
                <ClipboardList className="h-6 w-6 text-[#00b0a6]" />
                <div>
                  <h3 className="font-medium text-[#072446]">Manage Surveys</h3>
                  <p className="text-sm text-gray-500">
                    Create and manage surveys for attendees
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
