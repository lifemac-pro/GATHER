"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { trpc } from "@/utils/trpc";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { ArrowLeft, Bell, Calendar, MapPin, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Sidebar from "@/components/ui/sidebar";

export default function NotificationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  // Unwrap params using React.use()
  const unwrappedParams = React.use(params);
  const notificationId = unwrappedParams.id;
  
  const router = useRouter();
  const { userId, isSignedIn, isLoaded } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Get the notification by ID
  const { data: notifications } = trpc.notification.getAll.useQuery();
  const notification = notifications?.find(n => 
    (typeof n._id === "string" ? n._id : n._id.toString()) === notificationId
  );
  
  // Mark as read mutation
  const markAsRead = trpc.notification.markAsRead.useMutation({
    onSuccess: () => {
      toast.success("Notification marked as read");
    },
  });
  
  // Mark notification as read when viewed
  useEffect(() => {
    if (notification && !notification.read && isSignedIn) {
      markAsRead.mutate({ id: notificationId });
    }
  }, [notification, notificationId, isSignedIn]);
  
  // If not loaded yet, show loading state
  if (!isLoaded) {
    return <div className="p-8">Loading...</div>;
  }
  
  // If not signed in, show sign-in message
  if (!isSignedIn) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#6fc3f7] p-8">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
          <h1 className="mb-6 text-2xl font-bold text-[#072446]">Sign In Required</h1>
          <p className="mb-4 text-gray-600">You need to sign in to view notification details.</p>
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
                The notification you're looking for could not be found. It may have been deleted or you may not have permission to view it.
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
              Notification Details
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
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-[#072446]">
                {notification.title}
              </h2>
              <span className="text-sm text-gray-500">
                {formatDistanceToNow(new Date(notification.createdAt), {
                  addSuffix: true,
                })}
              </span>
            </div>
            
            {notification.type && (
              <div className="mb-4">
                <span className={`rounded-full px-3 py-1 text-sm ${getNotificationTypeColor(notification.type)}`}>
                  {notification.type.replace(/_/g, " ")}
                </span>
              </div>
            )}
            
            <div className="mb-6 rounded-lg bg-gray-50 p-4">
              <p className="whitespace-pre-wrap text-gray-700">{notification.message}</p>
            </div>
            
            {notification.link && notification.link !== `/attendee/notification/${notificationId}` && (
              <div className="mt-6">
                <Button
                  onClick={() => router.push(notification.link)}
                  className="bg-[#00b0a6] text-white hover:bg-[#009991]"
                >
                  View Related Content
                </Button>
              </div>
            )}
            
            {notification.eventId && (
              <div className="mt-6 rounded-lg border border-gray-200 p-4">
                <h3 className="mb-2 text-lg font-medium text-[#072446]">Related Event</h3>
                <div className="flex items-center space-x-2 text-gray-600">
                  <Calendar size={16} />
                  <span>Event ID: {notification.eventId}</span>
                </div>
                <Button
                  onClick={() => router.push(`/attendee/events/${notification.eventId}`)}
                  variant="outline"
                  className="mt-3 border-[#00b0a6] text-[#00b0a6] hover:bg-[#00b0a6] hover:text-white"
                >
                  View Event
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
