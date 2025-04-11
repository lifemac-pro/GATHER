"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { trpc } from "@/utils/trpc";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { ArrowLeft, Upload } from "lucide-react";
import { useEventContext } from "@/context/event-context";
import type { Event } from "@/server/db/models/event";

export default function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Unwrap params using React.use()
  const unwrappedParams = React.use(params);
  const eventId = unwrappedParams.id;

  const router = useRouter();
  const { userId, isSignedIn, isLoaded } = useAuth();
  const { setLastUpdated } = useEventContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Form state with default values
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [image, setImage] = useState("/images/tech-conference.jpg");
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

  // Use trpc for data fetching
  const [event, setEvent] = useState<Event | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Get the event by ID using trpc
  const {
    data: eventData,
    isError,
    error,
  } = trpc.event.getById.useQuery(
    { id: eventId },
    {
      enabled: !!eventId,
      retry: 3,
      retryDelay: 1000,
      refetchOnWindowFocus: false,
    },
  );

  // Create a mock event with default values
  const createMockEvent = useCallback(() => {
    return {
      _id: eventId,
      title: "Event Title",
      description: "Event Description",
      date: "January 1, 2025",
      location: "Event Location",
      image: "/images/tech-conference.jpg",
      capacity: 100,
      createdBy: userId ?? "",
      attendees: [],
      createdAt: new Date(),
    };
  }, [eventId, userId]);

  // Effect to handle the tRPC query result
  useEffect(() => {
    if (eventData) {
      // Event found successfully
      console.log("Event data fetched successfully:", eventData);

      // Type assertion for eventData
      const typedEventData = eventData as Event;

      // Update form with event data
      setTitle(typedEventData.title ?? "");
      setDescription(typedEventData.description ?? "");
      setDate(typedEventData.date ?? "");
      setLocation(typedEventData.location ?? "");
      setImage(typedEventData.image ?? "/images/tech-conference.jpg");
      setCapacity(typedEventData.capacity ?? 100);
      setEvent(typedEventData);
      setIsLoading(false);
    } else if (isError) {
      console.error("Error fetching event:", error);
      setFetchError(error?.message || "Failed to load event data");
      toast.error(`Error fetching event: ${error?.message || "Unknown error"}`);

      // Use mock data as fallback
      const mockEvent = createMockEvent();
      setTitle(mockEvent.title);
      setDescription(mockEvent.description);
      setDate(mockEvent.date);
      setLocation(mockEvent.location);
      setImage(mockEvent.image);
      setCapacity(mockEvent.capacity);
      setEvent(mockEvent);
      setIsLoading(false);
    }
  }, [eventData, isError, error, eventId, userId, createMockEvent]);

  // Add a timeout as a fallback
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.log("Loading timeout reached, using mock data");
        setIsLoading(false);
        toast.warning(
          "Failed to load event data in time, using default values",
        );

        // Use mock data as fallback
        const mockEvent = createMockEvent();
        setTitle(mockEvent.title);
        setDescription(mockEvent.description);
        setDate(mockEvent.date);
        setLocation(mockEvent.location);
        setImage(mockEvent.image);
        setCapacity(mockEvent.capacity);
        setEvent(mockEvent);
      }
    }, 5000); // 5 second timeout

    return () => clearTimeout(timeout);
  }, [isLoading, eventId, userId, createMockEvent]);

  // Add effect to log the current form state
  useEffect(() => {
    console.log("Current form state:", {
      title,
      description,
      date,
      location,
      image,
      capacity,
      isLoading,
      eventId,
    });
  }, [title, description, date, location, image, capacity, isLoading, eventId]);

  // Update event mutation
  const updateEvent = trpc.event.update.useMutation({
    onSuccess: () => {
      toast.success("Event updated successfully!");
      // Update the lastUpdated value in the context
      setLastUpdated(new Date());
      router.push("/admin/events");
    },
    onError: (error) => {
      console.error("Update error:", error);
      toast.error(`Failed to update event: ${error.message}`);
      setIsSubmitting(false);

      // Try to continue anyway after a short delay
      setTimeout(() => {
        toast.success("Redirecting to events list");
        router.push("/admin/events");
      }, 2000);
    },
  });

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

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isSignedIn || !userId) {
      toast.error("You must be signed in to update events");
      return;
    }

    setIsSubmitting(true);

    // Use the image preview URL if available, otherwise use the selected image
    const finalImageUrl = imagePreview ?? image;

    try {
      await updateEvent.mutateAsync({
        _id: eventId,
        title,
        description,
        date,
        location,
        image: finalImageUrl,
        capacity,
        createdBy: event?.createdBy ?? userId,
        attendees: event?.attendees ?? [],
        createdAt: event?.createdAt ? new Date(event.createdAt) : new Date(),
      });
    } catch (error) {
      console.error("Error updating event:", error);
    }

    console.log("Submitting update with data:", {
      _id: eventId,
      title,
      description,
      date,
      location,
      image: finalImageUrl,
      capacity,
      createdBy: event?.createdBy ?? userId,
    });
  };

  // If not loaded yet, show loading state with retry button
  if (!isLoaded || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#6fc3f7] p-8">
        <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-lg">
          <h1 className="mb-4 text-2xl font-bold text-[#072446]">Loading...</h1>
          <p className="text-gray-600">
            Please wait while we fetch the event details.
          </p>
          <p className="mt-2 text-sm text-gray-500">Event ID: {eventId}</p>
          {fetchError && (
            <div className="mt-4 rounded-md bg-red-50 p-4 text-left">
              <p className="text-sm text-red-600">Error: {fetchError}</p>
            </div>
          )}

          <div className="mt-6 flex justify-center space-x-4">
            <Button
              onClick={() => router.push("/admin/events")}
              variant="outline"
              className="border-gray-300 text-gray-700"
            >
              Back to Events
            </Button>
            <Button
              onClick={() => window.location.reload()}
              className="bg-[#E1A913] text-white hover:bg-[#c99a0f]"
            >
              Retry Loading
            </Button>
          </div>
        </div>
      </div>
    );
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
          <h1 className="text-3xl font-bold text-[#072446]">Edit Event</h1>
          <Button
            onClick={() => router.push("/admin/events")}
            variant="outline"
            className="flex items-center space-x-2 border-[#072446] bg-white text-[#072446]"
          >
            <ArrowLeft size={16} />
            <span>Back to Events</span>
          </Button>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Event Title*
              </label>
              <input
                type="text"
                value={title || ""}
                onChange={(e) => setTitle(e.target.value || "")}
                className="w-full rounded-md border border-gray-300 p-2"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Description*
              </label>
              <textarea
                value={description || ""}
                onChange={(e) => setDescription(e.target.value || "")}
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
                  value={date || ""}
                  onChange={(e) => setDate(e.target.value || "")}
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
                  value={location || ""}
                  onChange={(e) => setLocation(e.target.value || "")}
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
                  value={capacity || 100}
                  onChange={(e) => setCapacity(parseInt(e.target.value) || 100)}
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
                        Current image:
                      </p>
                      <img
                        src={image}
                        alt={title}
                        className="mb-2 h-40 w-full rounded-md object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "/images/tech-conference.jpg";
                        }}
                      />
                      <p className="mb-1 text-sm text-gray-500">
                        Or select from available images:
                      </p>
                      <select
                        value={image || "/images/tech-conference.jpg"}
                        onChange={(e) =>
                          setImage(
                            e.target.value || "/images/tech-conference.jpg",
                          )
                        }
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
                onClick={() => router.push("/admin/events")}
                variant="outline"
                className="border-gray-300 text-gray-700"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#E1A913] text-white hover:bg-[#c99a0f]"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Updating..." : "Update Event"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
