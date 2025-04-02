"use client";

import React, { useState } from "react";
import Sidebar from "@/components/ui/sidebar";
import { Menu, X, Bell, Trash2, Check } from "lucide-react";
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

      {/* Main Content */}
      <main className="flex-1 p-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-[#072446]">Notifications</h1>
            {unreadCount && unreadCount > 0 && (
              <Button
                onClick={handleMarkAllAsRead}
                className="bg-[#E1A913] text-white hover:bg-[#c99a0f]"
              >
                Mark all as read
              </Button>
            )}
          </div>

          {notifications?.length === 0 ? (
            <div className="py-8 text-center">
              <Bell className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No notifications
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                You don't have any notifications yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications?.map((notification) => (
                <div
                  key={notification._id}
                  className={`rounded-lg border p-4 ${
                    notification.read
                      ? "bg-white"
                      : "border-blue-200 bg-blue-50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-[#072446]">
                        {notification.title}
                      </h3>
                      <p className="mt-1 text-sm text-gray-600">
                        {notification.message}
                      </p>
                      <p className="mt-2 text-xs text-gray-500">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      {!notification.read && (
                        <button
                          onClick={() => handleMarkAsRead(notification._id)}
                          className="text-green-600 hover:text-green-700"
                          title="Mark as read"
                        >
                          <Check size={20} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(notification._id)}
                        className="text-red-600 hover:text-red-700"
                        title="Delete notification"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                  {notification.link && (
                    <a
                      href={notification.link}
                      className="mt-2 inline-block text-sm text-[#E1A913] hover:text-[#c99a0f]"
                    >
                      View details →
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default NotificationsPage;
