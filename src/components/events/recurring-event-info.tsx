"use client";

import { useState, useEffect } from "react";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { cn } from "@/lib/utils";
import { format, addMonths, startOfMonth, endOfMonth } from "date-fns";
import {
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";

interface RecurringEventInfoProps {
  eventId: string;
  isRecurring: boolean;
  recurrenceRule?: any;
}

export function RecurringEventInfo({
  eventId,
  isRecurring,
  recurrenceRule,
}: RecurringEventInfoProps) {
  const [date, setDate] = useState<Date>(new Date());
  const [viewRange, setViewRange] = useState<[Date, Date]>(() => {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    return [start, end];
  });

  // Update view range when date changes
  useEffect(() => {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    setViewRange([start, end]);
  }, [date]);

  // Get recurring event instances
  const {
    data: instances,
    isLoading,
    refetch,
  } = api.event.getRecurringInstances.useQuery(
    {
      parentEventId: eventId,
      startDate: viewRange[0],
      endDate: viewRange[1],
    },
    {
      enabled: isRecurring && !!eventId,
      refetchOnWindowFocus: false,
    },
  );

  // Navigate to previous month
  const prevMonth = () => {
    setDate((prev) => addMonths(prev, -1));
  };

  // Navigate to next month
  const nextMonth = () => {
    setDate((prev) => addMonths(prev, 1));
  };

  // Format recurrence rule as text
  const formatRecurrenceRule = () => {
    if (!recurrenceRule) return "No recurrence information available";

    const {
      frequency,
      interval,
      daysOfWeek,
      daysOfMonth,
      monthsOfYear,
      endDate,
      count,
    } = recurrenceRule;

    let text = `Repeats ${
      frequency === "daily"
        ? "daily"
        : frequency === "weekly"
          ? "weekly"
          : frequency === "monthly"
            ? "monthly"
            : "yearly"
    }`;

    if (interval && interval > 1) {
      text += ` every ${interval} ${
        frequency === "daily"
          ? "days"
          : frequency === "weekly"
            ? "weeks"
            : frequency === "monthly"
              ? "months"
              : "years"
      }`;
    }

    if (daysOfWeek && daysOfWeek.length > 0) {
      const dayNames = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      const dayList = daysOfWeek.map((day) => dayNames[day]).join(", ");
      text += ` on ${dayList}`;
    }

    if (daysOfMonth && daysOfMonth.length > 0) {
      const dayList = daysOfMonth.join(", ");
      text += ` on day${daysOfMonth.length > 1 ? "s" : ""} ${dayList} of the month`;
    }

    if (monthsOfYear && monthsOfYear.length > 0) {
      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      const monthList = monthsOfYear
        .map((month) => monthNames[month])
        .join(", ");
      text += ` in ${monthList}`;
    }

    if (endDate) {
      text += ` until ${format(new Date(endDate), "MMMM d, yyyy")}`;
    } else if (count) {
      text += ` for ${count} occurrence${count > 1 ? "s" : ""}`;
    } else {
      text += ` indefinitely`;
    }

    return text;
  };

  if (!isRecurring) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recurring Event</CardTitle>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
        <CardDescription>{formatRecurrenceRule()}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous month</span>
            </Button>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(date, "MMMM yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(date) => date && setDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Button variant="outline" size="sm" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next month</span>
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="lg" text="Loading occurrences..." />
            </div>
          ) : instances && instances.length > 0 ? (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">
                Upcoming occurrences in {format(date, "MMMM yyyy")}:
              </h3>
              <div className="divide-y rounded-md border">
                {instances.map((instance) => (
                  <div key={instance.id} className="p-3">
                    <div className="font-medium">
                      {format(
                        new Date(instance.startDate),
                        "EEEE, MMMM d, yyyy",
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(instance.startDate), "h:mm a")} -{" "}
                      {format(new Date(instance.endDate), "h:mm a")}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-4 text-center text-muted-foreground">
              No occurrences found for this month
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
