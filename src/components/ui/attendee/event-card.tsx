"use client";

import { format } from "date-fns";
import { CalendarDays, Clock, MapPin, ExternalLink } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface EventCardProps {
  id: string;
  name: string;
  startDate: Date;
  endDate?: Date;
  startTime?: string;
  endTime?: string;
  location?: string;
  status: "registered" | "waitlisted" | "attended" | "pending" | "cancelled";
  onClick?: () => void;
}

export function EventCard({
  id,
  name,
  startDate,
  endDate,
  startTime,
  endTime,
  location,
  status,
  onClick,
}: EventCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "registered":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
      case "waitlisted":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100";
      case "attended":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100";
      case "pending":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100";
    }
  };

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-bold text-[#E1A913]">{name}</CardTitle>
        <Badge className={cn("mt-1 capitalize", getStatusColor(status))}>
          {status}
        </Badge>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-2 text-sm">
          <div className="flex items-center text-[#00b0a6]">
            <CalendarDays className="mr-2 h-4 w-4" />
            <span>
              {format(new Date(startDate), "MMMM d, yyyy")}
              {endDate && endDate.toString() !== startDate.toString() && 
                ` - ${format(new Date(endDate), "MMMM d, yyyy")}`}
            </span>
          </div>
          
          {startTime && (
            <div className="flex items-center text-[#00b0a6]">
              <Clock className="mr-2 h-4 w-4" />
              <span>
                {startTime}
                {endTime && ` - ${endTime}`}
              </span>
            </div>
          )}
          
          {location && (
            <div className="flex items-center text-[#B0B8C5]">
              <MapPin className="mr-2 h-4 w-4" />
              <span>{location}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={onClick} 
          className="w-full bg-[#00b0a6] text-white hover:bg-[#00b0a6]/90"
        >
          View Details
          <ExternalLink className="ml-1 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
