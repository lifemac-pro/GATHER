"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { trpc } from "@/utils/trpc";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { ArrowLeft, Bell, Send } from "lucide-react";

export default function AdminNotificationsPage() {
  const router = useRouter();
  const { userId, isSignedIn, isLoaded } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<
    | "EVENT_UPDATE"
    | "EVENT_REMINDER"
    | "SURVEY_AVAILABLE"
    | "REGISTRATION_CONFIRMATION"
  >("EVENT_UPDATE");
  const [link, setLink] = useState("");

  // Get all notifications for admin view
  const {
    data: notifications,
    isLoading,
    refetch,
  } = trpc.notification.getAllNotifications.useQuery();

  // Create notification mutation
  const createNotification = trpc.notification.createNotification.useMutation({
    onSuccess: () => {
      toast.success("Notification sent successfully!");
      resetForm();
      void refetch();
    },
    onError: (error) => {
      toast.error(`Failed to send notification: ${error.message}`);
      setIsSubmitting(false);
    },
  });

  // Reset form
  const resetForm = () => {
    setTitle("");
    setMessage("");
    setType("EVENT_UPDATE");
    setLink("");
    setIsSubmitting(false);
  };

  // Validate link format
  const validateLink = (link: string): boolean => {
    if (!link) return true; // Empty link is valid (optional)

    // Link should start with a slash and contain only valid path characters
    const validLinkPattern = /^\/[\w\-\/]+$/;
    return validLinkPattern.test(link);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isSignedIn || !userId) {
      toast.error("You must be signed in to send notifications");
      return;
    }

    // Validate link if provided
    if (link && !validateLink(link)) {
      toast.error("Please enter a valid link format (e.g., /attendee/events)");
      return;
    }

    setIsSubmitting(true);

    // Ensure link starts with a slash
    const formattedLink = link
      ? link.startsWith("/")
        ? link
        : `/${link}`
      : undefined;

    createNotification.mutate({
      title,
      message,
      type,
      link: formattedLink,
      isGlobal: true, // Send as global notification
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
          <h1 className="text-3xl font-bold text-[#072446]">Notifications</h1>
          <Button
            onClick={() => router.push("/admin")}
            variant="outline"
            className="flex items-center space-x-2 border-[#072446] bg-white text-[#072446]"
          >
            <ArrowLeft size={16} />
            <span>Back to Admin</span>
          </Button>
        </div>

        {/* Create Notification Form */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow-lg">
          <h2 className="mb-6 text-2xl font-semibold text-[#072446]">
            Send Notification
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Notification Title*
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
                Message*
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2"
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Notification Type*
                </label>
                <select
                  value={type}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setType(
                      e.target.value as
                        | "EVENT_UPDATE"
                        | "EVENT_REMINDER"
                        | "SURVEY_AVAILABLE"
                        | "REGISTRATION_CONFIRMATION",
                    )
                  }
                  className="w-full rounded-md border border-gray-300 p-2"
                  required
                >
                  <option value="EVENT_UPDATE">Event Update</option>
                  <option value="EVENT_REMINDER">Event Reminder</option>
                  <option value="SURVEY_AVAILABLE">Survey Available</option>
                  <option value="REGISTRATION_CONFIRMATION">
                    Registration Confirmation
                  </option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Link (Optional)
                </label>
                <input
                  type="text"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="e.g., /attendee/events"
                  className="w-full rounded-md border border-gray-300 p-2"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Enter a valid path like &quot;/attendee/events&quot; or
                  &quot;/attendee/dashboard&quot;
                </p>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <Button
                type="submit"
                className="flex items-center space-x-2 bg-[#00b0a6] text-white hover:bg-[#009991]"
                disabled={isSubmitting}
              >
                <Send size={16} />
                <span>{isSubmitting ? "Sending..." : "Send Notification"}</span>
              </Button>
            </div>
          </form>
        </div>

        {/* Notification History */}
        <div className="rounded-lg bg-white p-6 shadow-lg">
          <h2 className="mb-6 text-2xl font-semibold text-[#072446]">
            Notification History
          </h2>

          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <p className="text-gray-500">Loading notifications...</p>
            </div>
          ) : notifications && notifications.length > 0 ? (
            <div className="space-y-4">
              {notifications.map((notification, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-grow">
                      <div className="flex items-center space-x-2">
                        <Bell size={16} className="text-[#00b0a6]" />
                        <h3 className="font-medium text-[#072446]">
                          {notification.title}
                        </h3>
                      </div>
                      <p className="mt-2 text-sm text-gray-600">
                        {notification.message}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center text-xs text-gray-500">
                        <span className="mr-4">
                          Type:{" "}
                          {(notification.type as string).replace(/_/g, " ")}
                        </span>
                        <span className="mr-4">
                          Sent:{" "}
                          {new Date(
                            notification.createdAt as string | number | Date,
                          ).toLocaleDateString()}
                        </span>
                        <span className="mr-4">
                          Total: {notification.count}
                        </span>
                        <span className="font-medium text-[#00b0a6]">
                          Read: {notification.readCount}/{notification.count}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-40 flex-col items-center justify-center space-y-4 rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
              <p className="text-gray-500">No notifications sent yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
