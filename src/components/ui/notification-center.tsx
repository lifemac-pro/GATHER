"use client";

import { useState, useEffect } from "react";
import { Bell, X, Check, Info, Calendar, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { useUser } from "@clerk/nextjs";
import { api } from "@/trpc/react";
import { initializeSocket, subscribeToNotifications } from "@/lib/socket";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";

export function NotificationCenter() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Get notifications
  const { data: notifications, refetch: refetchNotifications } = 
    api.notification.getAll.useQuery(undefined, {
      enabled: isLoaded && !!user,
    });
  
  // Mark notification as read
  const markAsReadMutation = api.notification.markAsRead.useMutation({
    onSuccess: () => {
      refetchNotifications();
    },
  });
  
  // Mark all notifications as read
  const markAllAsReadMutation = api.notification.markAllAsRead.useMutation({
    onSuccess: () => {
      refetchNotifications();
    },
  });
  
  // Initialize socket connection and subscribe to notifications
  useEffect(() => {
    if (!isLoaded || !user) return;
    
    // Initialize socket
    const socket = initializeSocket(user.id);
    
    // Subscribe to notifications
    const unsubscribe = subscribeToNotifications(user.id, (notification) => {
      // Show toast notification
      toast({
        title: notification.title,
        description: notification.message,
        duration: 5000,
      });
      
      // Refetch notifications
      refetchNotifications();
    });
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isLoaded, user, refetchNotifications, toast]);
  
  // Update unread count
  useEffect(() => {
    if (!notifications) return;
    
    const count = notifications.filter((notification) => !notification.read).length;
    setUnreadCount(count);
  }, [notifications]);
  
  // Handle notification click
  const handleNotificationClick = (notification: any) => {
    // Mark as read
    markAsReadMutation.mutate({ id: notification.id });
    
    // Navigate to action URL if available
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
    
    // Close popover
    setIsOpen(false);
  };
  
  // Handle mark all as read
  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };
  
  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "event":
        return <Calendar className="h-4 w-4" />;
      case "survey":
        return <FileText className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };
  
  if (!isLoaded) return null;
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs"
              variant="destructive"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <Card className="border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Notifications</CardTitle>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 px-2 text-xs"
                onClick={handleMarkAllAsRead}
              >
                <Check className="mr-1 h-3 w-3" />
                Mark all as read
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[300px] px-3">
              {notifications && notifications.length > 0 ? (
                <div className="space-y-2 py-2">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`flex cursor-pointer items-start gap-2 rounded-md p-2 transition-colors hover:bg-muted ${
                        notification.read ? "opacity-70" : "bg-muted/50"
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className={`rounded-full p-1 ${
                        notification.read ? "bg-muted" : "bg-primary/10"
                      }`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium">{notification.title}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {notification.message}
                        </p>
                        {notification.actionLabel && (
                          <p className="text-[10px] font-medium text-primary">
                            {notification.actionLabel}
                          </p>
                        )}
                      </div>
                      {!notification.read && (
                        <div className="h-2 w-2 rounded-full bg-primary"></div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-full items-center justify-center py-8">
                  <p className="text-center text-sm text-muted-foreground">
                    No notifications
                  </p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
          <CardFooter className="border-t p-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full text-xs"
              onClick={() => router.push("/notifications")}
            >
              View all notifications
            </Button>
          </CardFooter>
        </Card>
      </PopoverContent>
    </Popover>
  );
}
