"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/trpc/react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NotificationCard } from "@/components/ui/attendee/notification-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search, Bell, CheckCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function AttendeeNotificationsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch notifications for the user
  const { data: notifications, isLoading: isNotificationsLoading } = 
    api.attendee.getNotifications.useQuery(
      undefined,
      { enabled: isLoaded && !!user }
    );

  // Mark notification as read
  const markAsRead = api.attendee.markNotificationAsRead.useMutation({
    onSuccess: () => {
      toast.success("Notification marked as read");
      // Invalidate the query to refresh the data
      utils.attendee.getNotifications.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to mark notification as read: ${error.message}`);
    }
  });

  // Mark all notifications as read
  const markAllAsRead = api.attendee.markAllNotificationsAsRead.useMutation({
    onSuccess: () => {
      toast.success("All notifications marked as read");
      // Invalidate the query to refresh the data
      utils.attendee.getNotifications.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to mark all notifications as read: ${error.message}`);
    }
  });

  // Delete notification
  const deleteNotification = api.attendee.deleteNotification.useMutation({
    onSuccess: () => {
      toast.success("Notification deleted");
      // Invalidate the query to refresh the data
      utils.attendee.getNotifications.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to delete notification: ${error.message}`);
    }
  });

  const utils = api.useUtils();
  const isLoading = !isLoaded || isNotificationsLoading;

  if (isLoading) {
    return (
      <div className="container flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" text="Loading notifications..." />
      </div>
    );
  }

  // Filter and separate notifications
  const filterNotifications = (items: any[] | undefined) => {
    if (!items) return [];
    if (!searchQuery.trim()) return items;
    
    return items.filter(item => 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.message.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const allNotifications = notifications || [];
  const filteredNotifications = filterNotifications(allNotifications);
  const unreadNotifications = filteredNotifications.filter(n => !n.read);
  const readNotifications = filteredNotifications.filter(n => n.read);

  const handleMarkAllAsRead = () => {
    if (unreadNotifications.length === 0) {
      toast.info("No unread notifications");
      return;
    }
    
    markAllAsRead.mutate();
  };

  return (
    <div className="container space-y-8 py-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search notifications..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-[#00b0a6]" />
          <span className="text-lg font-medium">
            {unreadNotifications.length} unread notification{unreadNotifications.length !== 1 ? 's' : ''}
          </span>
        </div>
        <Button
          variant="outline"
          onClick={handleMarkAllAsRead}
          disabled={unreadNotifications.length === 0}
          className="text-[#00b0a6] hover:text-[#00b0a6]"
        >
          <CheckCircle className="mr-2 h-4 w-4" />
          Mark All as Read
        </Button>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">
            All ({filteredNotifications.length})
          </TabsTrigger>
          <TabsTrigger value="unread">
            Unread ({unreadNotifications.length})
          </TabsTrigger>
          <TabsTrigger value="read">
            Read ({readNotifications.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-6">
          {filteredNotifications.length > 0 ? (
            <div className="space-y-4">
              {filteredNotifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  id={notification.id}
                  type={notification.type as "event" | "survey" | "reminder" | "info"}
                  title={notification.title}
                  message={notification.message}
                  date={new Date(notification.createdAt)}
                  read={notification.read}
                  actionLabel={notification.actionLabel}
                  onAction={() => {
                    if (notification.actionUrl) {
                      router.push(notification.actionUrl);
                    }
                  }}
                  onMarkAsRead={() => {
                    markAsRead.mutate({ notificationId: notification.id });
                  }}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <Bell className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">No notifications</h3>
                <p className="text-muted-foreground">
                  You don't have any notifications at the moment.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="unread" className="space-y-6">
          {unreadNotifications.length > 0 ? (
            <div className="space-y-4">
              {unreadNotifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  id={notification.id}
                  type={notification.type as "event" | "survey" | "reminder" | "info"}
                  title={notification.title}
                  message={notification.message}
                  date={new Date(notification.createdAt)}
                  read={notification.read}
                  actionLabel={notification.actionLabel}
                  onAction={() => {
                    if (notification.actionUrl) {
                      router.push(notification.actionUrl);
                    }
                  }}
                  onMarkAsRead={() => {
                    markAsRead.mutate({ notificationId: notification.id });
                  }}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle className="mb-4 h-12 w-12 text-green-500" />
                <h3 className="mb-2 text-lg font-semibold">All caught up!</h3>
                <p className="text-muted-foreground">
                  You don't have any unread notifications.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="read" className="space-y-6">
          {readNotifications.length > 0 ? (
            <div className="space-y-4">
              {readNotifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  id={notification.id}
                  type={notification.type as "event" | "survey" | "reminder" | "info"}
                  title={notification.title}
                  message={notification.message}
                  date={new Date(notification.createdAt)}
                  read={notification.read}
                  actionLabel={notification.actionLabel}
                  onAction={() => {
                    if (notification.actionUrl) {
                      router.push(notification.actionUrl);
                    }
                  }}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <Trash2 className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">No read notifications</h3>
                <p className="text-muted-foreground">
                  You don't have any read notifications.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
