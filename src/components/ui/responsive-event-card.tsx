"use client";

import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Users, ChevronRight, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ResponsiveEventCardProps {
  id: string;
  name: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  location?: string;
  isVirtual?: boolean;
  image?: string;
  attendeeCount?: number;
  maxAttendees?: number;
  status?: "upcoming" | "ongoing" | "past" | "cancelled";
  registrationStatus?: "registered" | "not-registered" | "waitlist" | "checked-in";
  role: "admin" | "attendee";
  className?: string;
}

export function ResponsiveEventCard({
  id,
  name,
  description,
  startDate,
  endDate,
  location,
  isVirtual,
  image,
  attendeeCount,
  maxAttendees,
  status = "upcoming",
  registrationStatus,
  role,
  className,
}: ResponsiveEventCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Format date and time
  const formattedDate = format(new Date(startDate), "EEE, MMM d, yyyy");
  const formattedTime = format(new Date(startDate), "h:mm a");
  
  // Get status badge color
  const getStatusColor = () => {
    switch (status) {
      case "upcoming":
        return "bg-blue-100 text-blue-800";
      case "ongoing":
        return "bg-green-100 text-green-800";
      case "past":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  // Get registration status badge color
  const getRegistrationStatusColor = () => {
    switch (registrationStatus) {
      case "registered":
        return "bg-green-100 text-green-800";
      case "not-registered":
        return "bg-gray-100 text-gray-800";
      case "waitlist":
        return "bg-yellow-100 text-yellow-800";
      case "checked-in":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  // Get registration status text
  const getRegistrationStatusText = () => {
    switch (registrationStatus) {
      case "registered":
        return "Registered";
      case "not-registered":
        return "Not Registered";
      case "waitlist":
        return "On Waitlist";
      case "checked-in":
        return "Checked In";
      default:
        return "";
    }
  };
  
  // Get card link based on role
  const getCardLink = () => {
    return role === "admin" 
      ? `/admin/events/${id}` 
      : `/attendee/events/${id}`;
  };
  
  return (
    <Card 
      className={cn(
        "group overflow-hidden transition-all duration-200 hover:shadow-md",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative">
        {/* Event image */}
        <div className="relative h-40 w-full overflow-hidden bg-gray-100">
          {image ? (
            <Image
              src={image}
              alt={name}
              fill
              className={cn(
                "object-cover transition-transform duration-500",
                isHovered ? "scale-110" : "scale-100"
              )}
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-r from-blue-50 to-indigo-50">
              <Calendar className="h-12 w-12 text-primary/30" />
            </div>
          )}
        </div>
        
        {/* Status badge */}
        <div className="absolute left-3 top-3 z-10">
          <Badge 
            variant="outline" 
            className={cn("border-0 font-medium", getStatusColor())}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        </div>
        
        {/* Registration status badge (for attendees) */}
        {role === "attendee" && registrationStatus && (
          <div className="absolute right-3 top-3 z-10">
            <Badge 
              variant="outline" 
              className={cn("border-0 font-medium", getRegistrationStatusColor())}
            >
              {getRegistrationStatusText()}
            </Badge>
          </div>
        )}
      </div>
      
      <CardHeader className="pb-2 pt-4">
        <div className="space-y-1">
          <h3 className="line-clamp-1 text-lg font-bold">{name}</h3>
          {description && (
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-2 pb-2">
        <div className="flex items-start gap-2">
          <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
          <div className="text-sm">
            <p>{formattedDate}</p>
            <p className="text-muted-foreground">{formattedTime}</p>
          </div>
        </div>
        
        {location && (
          <div className="flex items-start gap-2">
            {isVirtual ? (
              <ExternalLink className="mt-0.5 h-4 w-4 text-muted-foreground" />
            ) : (
              <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
            )}
            <p className="text-sm">
              {isVirtual ? "Virtual Event" : location}
            </p>
          </div>
        )}
        
        {(attendeeCount !== undefined || maxAttendees !== undefined) && (
          <div className="flex items-start gap-2">
            <Users className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <p className="text-sm">
              {attendeeCount !== undefined && maxAttendees !== undefined
                ? `${attendeeCount} / ${maxAttendees} attendees`
                : attendeeCount !== undefined
                ? `${attendeeCount} attendees`
                : maxAttendees !== undefined
                ? `Max ${maxAttendees} attendees`
                : ""}
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
            variant="outline" 
            className="w-full justify-between"
          >
            {role === "admin" ? "Manage Event" : "View Details"}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
