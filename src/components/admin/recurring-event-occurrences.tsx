"use client";

import { useState, useEffect } from "react";
import { format, addMonths, startOfMonth, endOfMonth } from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Edit, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/trpc/react";
import { useToast } from "@/components/ui/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { cn } from "@/lib/utils";
import { string } from "zod";

interface RecurringEventOccurrencesProps {
  recurringEventId: string;
  parentEventId: string;
}

interface RecurringEvent {
  excludedDates: string[];
  modifiedOccurrences: { date: string; eventId: string }[];
  recurrencePattern: {
    frequency: string;
    interval: number;
    endDate?: string;
    count?: number;
  };
}
const { data: fetchedRecurringEvent, isLoading: isLoadingRecurringEvent } =
  api.recurringEvent.getById.useQuery(
    { id: recurringEventId }
  );

export function RecurringEventOccurrences({ recurringEventId, parentEventId }: RecurringEventOccurrencesProps) {
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");

  // Calculate date range for current month
  const startDate = startOfMonth(currentDate);
  const endDate = endOfMonth(currentDate);

  // Get recurring event details
  const { data: recurringEvent, isLoading: isLoadingRecurringEvent } =
    api.recurringEvent.getById.useQuery<RecurringEvent | null>(
      { id: recurringEventId },
  // Removed duplicate declaration of parentEvent

  // Get occurrences for the current month
  const { data: occurrences, isLoading: isLoadingOccurrences, refetch: refetchOccurrences } =
    api.recurringEvent.getOccurrences.useQuery(
      {
        recurringEventId,
        startDate,
        endDate
      },
      { enabled: !!recurringEventId }
    );
    

  // Get parent event details
  const { data: parentEvent, isLoading: isLoadingParentEvent } =
    api.event.getById.useQuery(
      { id: parentEventId },
      { enabled: !!parentEventId }
    );

  // Exclude date mutation
  const excludeDateMutation = api.recurringEvent.excludeDate.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Date excluded successfully",
      });
      refetchOccurrences();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to exclude date",
        variant: "destructive",
      });
    },
  });

  // Include date mutation
  const includeDateMutation = api.recurringEvent.includeDate.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Date included successfully",
      });
      refetchOccurrences();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to include date",
        variant: "destructive",
      });
    },
  });

  // Handle excluding a date
  const handleExcludeDate = (date: Date) => {
    excludeDateMutation.mutate({
      id: recurringEventId,
      date,
    });
  };

  // Handle including a date
  const handleIncludeDate = (date: Date) => {
    includeDateMutation.mutate({
      id: recurringEventId,
      date,
    });
  };

  // Navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentDate(prevDate => addMonths(prevDate, -1));
  };

  // Navigate to next month
  const goToNextMonth = () => {
    setCurrentDate(prevDate => addMonths(prevDate, 1));
  };

  // Check if a date is excluded
  const isDateExcluded = (date: Date) => {
    if (!recurringEvent) return false;

    return recurringEvent.excludedDates.some(
      (excludedDate) => new Date(excludedDate).toDateString() === date.toDateString()
    );
  };

  // Check if a date is modified
  const getModifiedEventId = (date: Date) => {
    if (!recurringEvent) return null;

    const modifiedOccurrence = recurringEvent.modifiedOccurrences.find(
      (occurrence) => new Date(occurrence.date).toDateString() === date.toDateString()
    );

    return modifiedOccurrence ? modifiedOccurrence.eventId : null;
  };

  // Format occurrence dates for calendar
  const getCalendarDates = () => {
    if (!occurrences) return [];

    return occurrences.map(occurrence => new Date(occurrence.date));
  };

  // Loading state
  const isLoading = isLoadingRecurringEvent || isLoadingOccurrences || isLoadingParentEvent;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="lg" text="Loading recurring event data..." />
      </div>
    );
  }

  if (!recurringEvent || !parentEvent) {
    return (
      <div className="rounded-md bg-yellow-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <CalendarIcon className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">No recurring event found</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>This event does not have recurring settings configured.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recurring Event Occurrences</CardTitle>
            <CardDescription>
              {parentEvent.name} - {recurringEvent.recurrencePattern.frequency} recurrence
            </CardDescription>
          </div>
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "calendar" | "list")}>
            <TabsList>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
              <TabsTrigger value="list">List</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <TabsContent value="calendar" className="mt-0">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">
                {format(currentDate, "MMMM yyyy")}
              </h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToPreviousMonth}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      Select Month
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={currentDate}
                      onSelect={(date) => date && setCurrentDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToNextMonth}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="rounded-md border">
              <Calendar
                mode="multiple"
                selected={getCalendarDates()}
                month={currentDate}
                className="rounded-md"
                modifiers={{
                  excluded: (date) => isDateExcluded(date),
                  modified: (date) => !!getModifiedEventId(date),
                }}
                modifiersClassNames={{
                  excluded: "line-through text-muted-foreground bg-muted",
                  modified: "border-2 border-primary",
                }}
                disabled={(date) => {
                  // Disable dates outside the current month
                  return date < startDate || date > endDate;
                }}
                onDayClick={(date) => {
                  if (isDateExcluded(date)) {
                    handleIncludeDate(date);
                  } else {
                    handleExcludeDate(date);
                  }
                }}
              />
            </div>

            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded-full bg-primary"></div>
                <span>Occurrence</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded-full border-2 border-primary"></div>
                <span>Modified</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded-full bg-muted"></div>
                <span>Excluded</span>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="list" className="mt-0">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">
                {format(currentDate, "MMMM yyyy")}
              </h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToPreviousMonth}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      Select Month
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={currentDate}
                      onSelect={(date) => date && setCurrentDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToNextMonth}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="rounded-md border">
              {occurrences && occurrences.length > 0 ? (
                <div className="divide-y">
                  {occurrences.map((occurrence, index) => {
                    const date = new Date(occurrence.date);
                    const excluded = isDateExcluded(date);
                    const modifiedEventId = getModifiedEventId(date);

                    return (
                      <div
                        key={index}
                        className={cn(
                          "flex items-center justify-between p-4",
                          excluded && "bg-muted"
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                            <CalendarIcon className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className={cn(
                              "font-medium",
                              excluded && "line-through text-muted-foreground"
                            )}>
                              {format(date, "EEEE, MMMM d, yyyy")}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {format(date, "h:mm a")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {modifiedEventId && (
                            <Badge variant="outline" className="border-primary text-primary">
                              Modified
                            </Badge>
                          )}
                          {excluded ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleIncludeDate(date)}
                            >
                              <Check className="mr-1 h-4 w-4" />
                              Include
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleExcludeDate(date)}
                            >
                              <X className="mr-1 h-4 w-4" />
                              Exclude
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="icon"
                            asChild
                          >
                            <a href={`/admin/events/${modifiedEventId || parentEventId}`} target="_blank">
                              <Edit className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center p-8 text-center">
                  <div>
                    <CalendarIcon className="mx-auto h-10 w-10 text-muted-foreground" />
                    <p className="mt-2 text-lg font-medium">No occurrences found</p>
                    <p className="text-sm text-muted-foreground">
                      There are no occurrences for this recurring event in the selected month.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </CardContent>
      <CardFooter className="flex justify-between">
        <p className="text-sm text-muted-foreground">
          {recurringEvent.recurrencePattern.frequency === "daily" && `Repeats every ${recurringEvent.recurrencePattern.interval} day(s)`}
          {recurringEvent.recurrencePattern.frequency === "weekly" && `Repeats every ${recurringEvent.recurrencePattern.interval} week(s)`}
          {recurringEvent.recurrencePattern.frequency === "monthly" && `Repeats every ${recurringEvent.recurrencePattern.interval} month(s)`}
          {recurringEvent.recurrencePattern.frequency === "yearly" && `Repeats every ${recurringEvent.recurrencePattern.interval} year(s)`}

          {recurringEvent.recurrencePattern.endDate &&
            ` until ${format(new Date(recurringEvent.recurrencePattern.endDate), "MMMM d, yyyy")}`}

          {recurringEvent.recurrencePattern.count &&
            ` for ${recurringEvent.recurrencePattern.count} occurrences`}
        </p>
        <Button variant="outline" asChild>
          <a href={`/admin/events/${parentEventId}/edit`}>
            Edit Parent Event
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}
