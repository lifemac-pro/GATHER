"use client";

import { Bell, Calendar, FileText, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type NotificationType = "event" | "survey" | "reminder" | "info";

interface NotificationCardProps {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  date: Date;
  read: boolean;
  actionLabel?: string;
  onAction?: () => void;
  onMarkAsRead?: () => void;
}

export function NotificationCard({
  id,
  type,
  title,
  message,
  date,
  read,
  actionLabel,
  onAction,
  onMarkAsRead,
}: NotificationCardProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    }).format(date);
  };

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case "event":
        return <Calendar className="h-5 w-5 text-[#E1A913]" />;
      case "survey":
        return <FileText className="h-5 w-5 text-[#00b0a6]" />;
      case "reminder":
        return <Bell className="h-5 w-5 text-[#E1A913]" />;
      case "info":
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <Bell className="h-5 w-5 text-[#E1A913]" />;
    }
  };

  return (
    <Card
      className={cn(
        "transition-all hover:shadow-md",
        !read && "border-l-4 border-l-[#00b0a6]"
      )}
    >
      <CardContent className="flex gap-4 p-4">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-muted">
          {getIcon(type)}
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-start justify-between">
            <h4 className="font-medium">{title}</h4>
            <span className="text-xs text-muted-foreground">
              {formatDate(date)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{message}</p>
          {actionLabel && onAction && (
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onAction}
                className="text-[#00b0a6] hover:bg-[#00b0a6]/10 hover:text-[#00b0a6]"
              >
                {actionLabel}
              </Button>
              {!read && onMarkAsRead && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onMarkAsRead}
                  className="ml-2 text-muted-foreground"
                >
                  Mark as read
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
