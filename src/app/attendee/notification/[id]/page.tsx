"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
// import Link from "next/link";
import { Button } from "@/components/ui/button";
import { trpc } from "@/utils/trpc";
import { useAuth } from "@clerk/nextjs";
// import { toast } from "sonner";
import { ArrowLeft, Bell, Calendar } from "lucide-react"; // MapPin, Users removed as unused
import { formatDistanceToNow } from "date-fns";
import Sidebar from "@/components/ui/sidebar";

export default function NotificationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Use React.use() to unwrap params
  const { id: notificationId } = React.use(params);

  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Track whether we've already marked this notification as read
  const [hasMarkedAsRead, setHasMarkedAsRead] = useState(false);

  // Get the notification by ID
  const { data: notifications } = trpc.notification.getAll.useQuery();
  const notification = notifications?.find(
    (n) =>
      (typeof n._id === "string" ? n._id : n._id.toString()) === notificationId,
  );

  // Mark as read mutation
  const markAsRead = trpc.notification.markAsRead.useMutation({
    onSuccess: () => {
      setHasMarkedAsRead(true);
    },
    onError: (error) => {
      console.error("Error marking notification as read:", error);
      // Don't show an error toast to the user, just log it
      // Still set hasMarkedAsRead to true to prevent further attempts
      setHasMarkedAsRead(true);
    },
  });

  // Delete notification mutation
  const deleteNotification = trpc.notification.delete.useMutation({
    onSuccess: () => {
      router.push("/attendee/notifications");
    },
    onError: (error) => {
      console.error("Error deleting notification:", error);
    },
  });

  // Handle mark as read
  const handleMarkAsRead = () => {
    if (!notification || notification.read || hasMarkedAsRead) return;

    markAsRead.mutate({ id: notificationId });
  };

  // Handle delete
  const handleDelete = () => {
    if (!notification) return;

    deleteNotification.mutate({ id: notificationId });
  };

  // Check if the notification ID is valid
  const isValidObjectId = useMemo(() => {
    try {
      // Check if it's a valid MongoDB ObjectId format
      return /^[0-9a-fA-F]{24}$/.test(notificationId);
    } catch (error) {
      return false;
    }
  }, [notificationId]);

  // Mark notification as read when viewed - only once
  useEffect(() => {
    // Only attempt to mark as read if we have a valid notification
    if (
      isValidObjectId &&
      notification &&
      !notification.read &&
      isSignedIn &&
      !hasMarkedAsRead &&
      !markAsRead.isPending
    ) {
      markAsRead.mutate({ id: notificationId });
    }
  }, [
    notification,
    notificationId,
    isSignedIn,
    markAsRead,
    hasMarkedAsRead,
    isValidObjectId,
  ]);

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
            Sign In Required
          </h1>
          <p className="mb-4 text-gray-600">
            You need to sign in to view notification details.
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

  // If notification not found, show error message
  if (!notification) {
    return (
      <div className="flex min-h-screen flex-col md:flex-row">
        {/* Desktop Sidebar */}
        <aside className="sticky top-0 hidden md:block">
          <Sidebar />
        </aside>

        {/* Mobile Navbar */}
        <nav className="flex items-center justify-between bg-[#072446] p-4 md:hidden">
          <button
            className="text-white"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open Menu"
          >
            <Bell size={24} />
          </button>
        </nav>

        {/* Mobile Sidebar (Overlay) */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-50 bg-black bg-opacity-50"
            onClick={() => setMobileMenuOpen(false)}
          >
            <aside
              className="fixed left-0 top-0 h-screen w-64 transform bg-[#072446] text-[#B0B8C5] shadow-lg transition-transform duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4">
                <button
                  className="text-white"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close Menu"
                >
                  <ArrowLeft size={24} />
                </button>
              </div>
              <Sidebar />
            </aside>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 bg-[#6fc3f7] p-6">
          <div className="mx-auto max-w-4xl">
            <div className="mb-6 flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
                Notification Not Found
              </h1>
              <Button
                onClick={() => router.push("/attendee/notifications")}
                variant="outline"
                className="flex items-center space-x-2 border-[#072446] bg-white text-[#072446]"
              >
                <ArrowLeft size={16} />
                <span>Back to Notifications</span>
              </Button>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-lg">
              <p className="text-gray-600">
                The notification you&apos;re looking for could not be found. It
                may have been deleted or you may not have permission to view it.
              </p>
              <Button
                onClick={() => router.push("/attendee/notifications")}
                className="mt-4 bg-[#00b0a6] text-white hover:bg-[#009991]"
              >
                Return to Notifications
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Get notification type color
  const getNotificationTypeColor = (type: string) => {
    switch (type) {
      case "EVENT_UPDATE":
        return "bg-blue-100 text-blue-800";
      case "EVENT_REMINDER":
        return "bg-yellow-100 text-yellow-800";
      case "SURVEY_AVAILABLE":
        return "bg-green-100 text-green-800";
      case "REGISTRATION_CONFIRMATION":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="sticky top-0 hidden md:block">
        <Sidebar />
      </aside>

      {/* Mobile Navbar */}
      <nav className="flex items-center justify-between bg-[#082865] p-4 shadow-md md:hidden">
        <h2 className="text-xl font-bold text-white">GatherEase</h2>
        <button
          className="text-white"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open Menu"
        >
          <Bell size={24} />
        </button>
      </nav>

      {/* Mobile Sidebar (Overlay) */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-70 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        >
          <aside
            className="fixed left-0 top-0 h-screen w-72 transform bg-gradient-to-b from-[#082865] to-[#004BD9] shadow-lg transition-transform duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4">
              <button
                className="absolute right-4 top-4 text-white/80 transition hover:text-white"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close Menu"
              >
                <ArrowLeft size={24} />
              </button>
            </div>
            <Sidebar />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 bg-gradient-to-b from-[#f0f9ff] to-[#e0f2fe] p-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 rounded-xl bg-gradient-to-r from-[#082865] to-[#0055FF] p-6 shadow-lg">
            <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
              <h1 className="text-2xl font-bold text-white md:text-3xl">
                Notification Details
              </h1>
              <Button
                onClick={() => router.push("/attendee/notifications")}
                className="rounded-lg bg-white/10 px-4 py-2 text-white backdrop-blur-sm transition-all hover:bg-white/20"
              >
                <ArrowLeft size={16} className="mr-2" />
                <span>Back to Notifications</span>
              </Button>
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-md">
            <div className="mb-6 border-b border-gray-100 pb-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-2xl font-bold text-[#082865]">
                  {notification.title}
                </h2>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${notification.read ? "bg-gray-100 text-gray-600" : "bg-[#0055FF] text-white"}`}
                >
                  {notification.read ? "Read" : "Unread"}
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                {formatDistanceToNow(new Date(notification.createdAt), {
                  addSuffix: true,
                })}
              </p>
            </div>

            {notification.type && (
              <div className="mb-4">
                <span
                  className={`rounded-full px-3 py-1 text-sm font-medium ${getNotificationTypeColor(notification.type)}`}
                >
                  {notification.type.replace(/_/g, " ")}
                </span>
              </div>
            )}

            <div className="mb-6 rounded-lg bg-gray-50 p-6">
              <p className="whitespace-pre-wrap leading-relaxed text-gray-600">
                {notification.message}
              </p>
            </div>

            {notification.link &&
              notification.link !==
                `/attendee/notification/${notificationId}` && (
                <div className="mt-6">
                  <Button
                    onClick={() => router.push(notification.link)}
                    className="bg-[#0055FF] text-white hover:bg-[#004BD9]"
                  >
                    View Related Content
                  </Button>
                </div>
              )}

            {notification.eventId && (
              <div className="mt-6 rounded-lg bg-gray-50 p-6 shadow-sm">
                <h3 className="mb-3 text-lg font-bold text-[#082865]">
                  Related Event
                </h3>
                <div className="mb-4 flex items-center space-x-2 text-gray-600">
                  <Calendar size={16} className="text-[#0055FF]" />
                  <span>Event ID: {notification.eventId}</span>
                </div>
                <Button
                  onClick={() =>
                    router.push(`/attendee/events/${notification.eventId}`)
                  }
                  className="bg-[#0055FF] text-white hover:bg-[#004BD9]"
                >
                  View Event
                </Button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-8 flex flex-wrap justify-end gap-3 border-t border-gray-100 pt-6">
              <Button
                variant="outline"
                className="border-[#0055FF] bg-white text-[#0055FF] hover:bg-[#0055FF] hover:text-white"
                onClick={handleMarkAsRead}
                disabled={notification.read}
              >
                {notification.read ? "Already Read" : "Mark as Read"}
              </Button>
              <Button
                variant="outline"
                className="border-gray-300 bg-white text-gray-600 hover:bg-gray-100"
                onClick={handleDelete}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
