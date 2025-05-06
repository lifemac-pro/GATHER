"use client";

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Calendar, Clock, ChevronRight, CheckCircle, AlertCircle } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ResponsiveSurveyCardProps {
  id: string;
  title: string;
  description?: string;
  eventName: string;
  eventDate: Date;
  dueDate?: Date;
  responseCount?: number;
  totalAttendees?: number;
  isActive?: boolean;
  isCompleted?: boolean;
  role: "admin" | "attendee";
  className?: string;
}

export function ResponsiveSurveyCard({
  id,
  title,
  description,
  eventName,
  eventDate,
  dueDate,
  responseCount,
  totalAttendees,
  isActive = true,
  isCompleted = false,
  role,
  className,
}: ResponsiveSurveyCardProps) {
  // Format dates
  const formattedEventDate = format(new Date(eventDate), "MMM d, yyyy");
  
  // Get card link based on role
  const getCardLink = () => {
    return role === "admin" 
      ? `/admin/surveys/${id}` 
      : `/attendee/surveys/${id}`;
  };
  
  // Get button text based on role and completion status
  const getButtonText = () => {
    if (role === "admin") {
      return "View Responses";
    } else {
      return isCompleted ? "View Response" : "Take Survey";
    }
  };
  
  // Get response rate percentage
  const getResponseRate = () => {
    if (responseCount === undefined || totalAttendees === undefined || totalAttendees === 0) {
      return 0;
    }
    return Math.round((responseCount / totalAttendees) * 100);
  };
  
  return (
    <Card 
      className={cn(
        "overflow-hidden transition-all duration-200 hover:shadow-md",
        className
      )}
    >
      <CardHeader className="pb-2 pt-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="line-clamp-1 text-lg font-bold">{title}</h3>
            <p className="text-sm text-muted-foreground">
              {eventName}
            </p>
          </div>
          <div>
            {role === "admin" ? (
              <Badge variant={isActive ? "default" : "outline"}>
                {isActive ? "Active" : "Inactive"}
              </Badge>
            ) : (
              <Badge variant={isCompleted ? "default" : "outline"}>
                {isCompleted ? "Completed" : "Pending"}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3 pb-2">
        {description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {description}
          </p>
        )}
        
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm">Event: {formattedEventDate}</p>
        </div>
        
        {dueDate && (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm">
              Due: {formatDistanceToNow(new Date(dueDate), { addSuffix: true })}
            </p>
          </div>
        )}
        
        {role === "admin" && responseCount !== undefined && totalAttendees !== undefined && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span>Response Rate</span>
              <span>{getResponseRate()}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div 
                className="h-full bg-primary" 
                style={{ width: `${getResponseRate()}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {responseCount} of {totalAttendees} responses
            </p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-2">
        <Link 
          href={getCardLink()} 
          className="w-full"
        >
          <Button 
            variant={isCompleted ? "outline" : "default"} 
            className="w-full justify-between"
          >
            {getButtonText()}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
