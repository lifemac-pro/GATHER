"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CalendarPlus } from "lucide-react";
import { format } from "date-fns";

interface AddToCalendarProps {
  eventId: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location: string;
}

export function AddToCalendar({
  eventId,
  name,
  description,
  startDate,
  endDate,
  location,
}: AddToCalendarProps) {
  const generateGoogleCalendarUrl = () => {
    const baseUrl = "https://calendar.google.com/calendar/render";
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: name,
      details: description,
      location,
      dates: `${format(startDate, "yyyyMMdd'T'HHmmss'Z'")}/${format(
        endDate,
        "yyyyMMdd'T'HHmmss'Z'",
      )}`,
    });
    return `${baseUrl}?${params.toString()}`;
  };

  const generateOutlookCalendarUrl = () => {
    return `/api/calendar/${eventId}`;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <CalendarPlus className="mr-2 h-4 w-4" />
          Add to Calendar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem asChild>
          <a
            href={generateGoogleCalendarUrl()}
            target="_blank"
            rel="noopener noreferrer"
          >
            Google Calendar
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={generateOutlookCalendarUrl()} download={`${name}.ics`}>
            Outlook/iCal
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
