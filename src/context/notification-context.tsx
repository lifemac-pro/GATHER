"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { trpc } from "@/utils/trpc";

// Define the context type
type NotificationContextType = {
  unreadCount: number;
  isLoading: boolean;
  isError: boolean;
  markAsRead: (id: string) => void;
  refetchCount: () => void;
};

// Create the context with default values
const NotificationContext = createContext<NotificationContextType>({
  unreadCount: 0,
  isLoading: false,
  isError: false,
  markAsRead: () => {},
  refetchCount: () => {},
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

  // Use tRPC to get the real unread count
  const {
    data: unreadCountData,
    isLoading,
    isError,
    refetch,
  } = trpc.notification.getUnreadCount.useQuery(undefined, {
    refetchOnWindowFocus: false,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Mark notification as read mutation
  const markAsReadMutation = trpc.notification.markAsRead.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  // Update unread count when data changes
  useEffect(() => {
    if (unreadCountData !== undefined) {
      setUnreadCount(unreadCountData);
    }
  }, [unreadCountData]);

  // Function to mark a notification as read
  const markAsRead = (id: string) => {
    markAsReadMutation.mutate({ id });
  };

  // Function to refetch the unread count
  const refetchCount = () => {
    refetch();
  };

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        isLoading,
        isError,
        markAsRead,
        refetchCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
