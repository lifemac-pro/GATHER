"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

// Define the context type
type NotificationContextType = {
  unreadCount: number;
  isLoading: boolean;
  isError: boolean;
  markAsRead: (id: string) => void;
};

// Create the context with default values
const NotificationContext = createContext<NotificationContextType>({
  unreadCount: 0,
  isLoading: false,
  isError: false,
  markAsRead: () => {},
});

// Hook to use the notification context
export const useNotifications = () => useContext(NotificationContext);

// Provider component
export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Generate mock data on first load
  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      // Generate a random number between 0 and 5 for mock notifications
      setUnreadCount(Math.floor(Math.random() * 6));
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Mock function to mark a notification as read
  const markAsRead = (id: string) => {
    if (unreadCount > 0) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        isLoading,
        isError: false, // We're not making API calls, so no errors
        markAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
