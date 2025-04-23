"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { api } from "@/lib/api-client";
import { type NotificationResponse } from "@/types/api-responses";
import { useAuth } from "./auth-context";

/**
 * Notification context state
 */
interface NotificationContextState {
  notifications: NotificationResponse[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  markAsRead: (ids: string[]) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
}

// Create context with default values
const NotificationContext = createContext<NotificationContextState>({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  fetchNotifications: async () => {},
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  deleteNotification: async () => {},
});

/**
 * Notification provider props
 */
interface NotificationProviderProps {
  children: React.ReactNode;
}

/**
 * Notification provider component
 */
export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<NotificationResponse[]>(
    [],
  );
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await api.notifications.getAll<{
        items: NotificationResponse[];
      }>();

      if (response.success && response.data) {
        setNotifications(response.data.items);
        setUnreadCount(response.data.items.filter((n) => !n.read).length);
      }
    } catch (error) {
      setError("Failed to fetch notifications");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Fetch notifications on mount and when auth state changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated, fetchNotifications]);

  // Mark notifications as read
  const markAsRead = async (ids: string[]) => {
    try {
      setIsLoading(true);
      setError(null);

      await api.notifications.markAsRead(ids);

      // Update local state
      setNotifications((prev) =>
        prev.map((notification) =>
          ids.includes(notification.id)
            ? { ...notification, read: true }
            : notification,
        ),
      );

      setUnreadCount((prev) => Math.max(0, prev - ids.length));
    } catch (error) {
      setError("Failed to mark notifications as read");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      setIsLoading(true);
      setError(null);

      await api.notifications.markAllAsRead();

      // Update local state
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, read: true })),
      );

      setUnreadCount(0);
    } catch (error) {
      setError("Failed to mark all notifications as read");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete notification
  const deleteNotification = async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);

      await api.notifications.delete(id);

      // Update local state
      const notification = notifications.find((n) => n.id === id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));

      if (notification && !notification.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      setError("Failed to delete notification");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Context value
  const value: NotificationContextState = {
    notifications,
    unreadCount,
    isLoading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

/**
 * Hook to use notification context
 */
export function useNotifications() {
  const context = useContext(NotificationContext);

  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider",
    );
  }

  return context;
}
