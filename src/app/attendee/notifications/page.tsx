"use client";

import React, { useState } from "react";
import Sidebar from "@/components/ui/sidebar";
import { Menu, X } from "lucide-react";
import { trpc } from "@/utils/trpc";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const NotificationsPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: notifications, refetch } = trpc.notification.getAll.useQuery();
  const { data: unreadCount } = trpc.notification.getUnreadCount.useQuery();
  const markAsRead = trpc.notification.markAsRead.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Notification marked as read");
    },
  });
  const markAllAsRead = trpc.notification.markAllAsRead.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("All notifications marked as read");
    },
  });
  const deleteNotification = trpc.notification.delete.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Notification deleted");
    },
  });

  const handleMarkAsRead = async (id: string) => {
    await markAsRead.mutateAsync({ id });
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead.mutateAsync();
  };

  const handleDelete = async (id: string) => {
    await deleteNotification.mutateAsync({ id });
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
            {unreadCount && unreadCount > 0 && (
              <Button
                onClick={handleMarkAllAsRead}
                className="bg-[#E1A913] text-white hover:bg-[#c99a0f]"
              >
                Mark all as read
              </Button>
            )}
          </div>

          {/* Main Card Container */}
          <div className="rounded-lg bg-[#072446] p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-semibold text-[#E1A913]">
              Your Notifications
            </h2>

            {notifications?.length === 0 ? (
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-gray-500">
                  No notifications available at the moment.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {notifications?.map((notification) => (
                  <div
                    key={
                      typeof notification._id === "string"
                        ? notification._id
                        : notification._id.toString()
                    }
                    className="flex flex-col justify-between rounded-lg border-l-4 border-[#E1A913] bg-[#072446] p-5 shadow-md md:flex-row md:items-center"
                  >
                    <div>
                      <h2 className="text-xl font-semibold text-[#E1A913]">
                        {notification.title}
                      </h2>
                      <p className="text-gray-400">{notification.message}</p>
                      <p className="mt-1 text-xs text-gray-400">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                      {!notification.read && (
                        <span className="mt-2 inline-block rounded bg-blue-100 px-2 py-1 text-xs text-blue-800">
                          New
                        </span>
                      )}
                    </div>
                    <div className="mt-4 flex space-x-2 md:ml-4 md:mt-0">
                      <Button
                        variant="outline"
                        className="bg-white hover:bg-gray-100"
                        onClick={() =>
                          handleMarkAsRead(
                            typeof notification._id === "string"
                              ? notification._id
                              : notification._id.toString(),
                          )
                        }
                        disabled={notification.read}
                      >
                        {notification.read ? "Read" : "Mark as Read"}
                      </Button>
                      <Button
                        variant="outline"
                        className="bg-white text-red-600 hover:bg-red-50"
                        onClick={() =>
                          handleDelete(
                            typeof notification._id === "string"
                              ? notification._id
                              : notification._id.toString(),
                          )
                        }
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default NotificationsPage;
