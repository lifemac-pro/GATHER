"use client";

import React, { useState } from "react";
import Sidebar from "@/components/ui/sidebar";
import { Menu, X, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { trpc } from "@/utils/trpc";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";
import { useNotifications } from "@/context/notification-context";

const NotificationsPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedNotificationId, setExpandedNotificationId] = useState<
    string | null
  >(null);
  const {
    data: notifications,
    isLoading,
    refetch,
  } = trpc.notification.getAll.useQuery();

  // Get notification context for updating unread count
  const { refetchCount } = useNotifications();

  // Toggle notification expansion
  const toggleNotificationExpansion = (id: string) => {
    setExpandedNotificationId(expandedNotificationId === id ? null : id);
  };
  const { data: unreadCount } = trpc.notification.getUnreadCount.useQuery();
  const markAsRead = trpc.notification.markAsRead.useMutation({
    onSuccess: () => {
      void refetch();
      toast.success("Notification marked as read");
    },
  });
  const markAllAsRead = trpc.notification.markAllAsRead.useMutation({
    onSuccess: () => {
      void refetch();
      toast.success("All notifications marked as read");
    },
  });
  const deleteNotification = trpc.notification.delete.useMutation({
    onSuccess: () => {
      void refetch();
      toast.success("Notification deleted");
    },
  });

  const deleteAllNotifications = trpc.notification.deleteAll.useMutation({
    onSuccess: () => {
      void refetch();
      toast.success("All notifications deleted");
      refetchCount();
    },
  });

  const handleMarkAsRead = async (id: string) => {
    await markAsRead.mutateAsync({ id });
    // Update the global notification count
    refetchCount();
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead.mutateAsync();
    // Update the global notification count
    refetchCount();
  };

  const handleDelete = async (id: string) => {
    await deleteNotification.mutateAsync({ id });
    // Update the global notification count
    refetchCount();
  };

  const handleDeleteAll = async () => {
    if (
      window.confirm(
        "Are you sure you want to delete all notifications? This action cannot be undone.",
      )
    ) {
      await deleteAllNotifications.mutateAsync();
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
          <Menu size={24} />
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
            onClick={(e) => e.stopPropagation()} // Prevent sidebar from closing when clicking inside
          >
            <div className="flex items-center justify-between p-4">
              <button
                className="text-white"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close Menu"
              >
                <X size={24} />
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
              Notifications
            </h1>
            <div className="flex space-x-2">
              {unreadCount && unreadCount > 0 && (
                <Button
                  onClick={handleMarkAllAsRead}
                  className="bg-[#E1A913] text-white hover:bg-[#c99a0f]"
                >
                  Mark all as read
                </Button>
              )}
              {notifications && notifications.length > 0 && (
                <Button
                  onClick={handleDeleteAll}
                  className="bg-red-500 text-white hover:bg-red-600"
                >
                  Delete all
                </Button>
              )}
            </div>
          </div>

          {/* Main Card Container */}
          <div className="rounded-lg bg-[#072446] p-6 shadow-md">
            <h2 className="mb-4 text-xl font-semibold text-[#E1A913]">
              Your Notifications
            </h2>

            {isLoading ? (
              <div className="flex h-40 items-center justify-center">
                <p className="text-gray-400">Loading notifications...</p>
              </div>
            ) : notifications?.length === 0 ? (
              <div className="rounded-lg border border-gray-600 bg-[#072446] p-4">
                <p className="text-gray-400">
                  No notifications available at the moment.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {notifications?.map((notification) => {
                  const notificationId =
                    typeof notification._id === "string"
                      ? notification._id
                      : notification._id.toString();

                  return (
                    <div
                      key={notificationId}
                      className={`rounded-lg border-l-4 ${notification.read ? "border-gray-600" : "border-[#E1A913]"} bg-[#072446] p-4 shadow-md`}
                    >
                      {/* Notification Header - Always Visible */}
                      <div className="flex items-center justify-between">
                        <div
                          className="flex-1 cursor-pointer"
                          onClick={() =>
                            toggleNotificationExpansion(notificationId)
                          }
                        >
                          <div className="flex items-center">
                            <h2 className="text-lg font-semibold text-[#E1A913]">
                              {notification.title}
                            </h2>
                            {!notification.read && (
                              <span className="ml-2 inline-block rounded-full bg-[#E1A913] px-2 py-0.5 text-xs text-white">
                                New
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">
                            {formatDistanceToNow(
                              new Date(notification.createdAt),
                              { addSuffix: true },
                            )}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 rounded-full p-0 text-red-500 hover:bg-red-100 hover:text-red-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleDelete(notificationId);
                            }}
                            title="Delete notification"
                          >
                            <X size={16} />
                          </Button>
                          {expandedNotificationId === notificationId ? (
                            <ChevronUp size={16} className="text-gray-400" />
                          ) : (
                            <ChevronDown
                              size={16}
                              className="cursor-pointer text-gray-400"
                              onClick={() =>
                                toggleNotificationExpansion(notificationId)
                              }
                            />
                          )}
                        </div>
                      </div>

                      {/* Expanded Content */}
                      {expandedNotificationId === notificationId && (
                        <div className="mt-3 border-t border-gray-600 pt-3">
                          <p className="text-gray-400">
                            {notification.message}
                          </p>

                          {notification.type && (
                            <div className="mt-2 text-sm">
                              <span className="rounded-full border border-gray-600 bg-[#072446] px-2 py-1 text-xs text-gray-400">
                                {notification.type.replace(/_/g, " ")}
                              </span>
                            </div>
                          )}

                          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                            <Link
                              href={`/attendee/notification/${notificationId}`}
                              className="inline-flex items-center text-sm text-[#E1A913] hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span>View Details</span>
                              <ExternalLink size={14} className="ml-1" />
                            </Link>

                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-[#E1A913] bg-[#072446] text-[#E1A913] hover:bg-[#E1A913] hover:text-white"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void handleMarkAsRead(notificationId);
                                }}
                                disabled={notification.read}
                              >
                                {notification.read ? "Read" : "Mark as Read"}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-red-500 bg-[#072446] text-red-500 hover:bg-red-500 hover:text-white"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void handleDelete(notificationId);
                                }}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default NotificationsPage;
