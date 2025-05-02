"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import { useToast } from "@/components/ui/use-toast";

// Define the form schema
const formSchema = z.object({
  frequency: z.enum(["daily", "weekly", "monthly", "yearly"]),
  interval: z.coerce.number().int().min(1).default(1),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
  dayOfMonth: z.coerce.number().int().min(1).max(31).optional(),
  monthOfYear: z.coerce.number().int().min(0).max(11).optional(),
  endDate: z.date().optional(),
  count: z.coerce.number().int().min(1).optional(),
  hasEndDate: z.boolean().default(false),
  hasCount: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

interface RecurringEventFormProps {
  eventId: string;
  onSuccess?: () => void;
}

export function RecurringEventForm({ eventId, onSuccess }: RecurringEventFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get existing recurring event data
  const { data: existingRecurringEvent, isLoading: isLoadingRecurringEvent } =
    api.recurringEvent.getByParentEvent.useQuery(
      { parentEventId: eventId },
      { enabled: !!eventId }
    );

  // Create recurring event mutation
  const createRecurringEventMutation = api.recurringEvent.create.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Recurring event created successfully",
      });
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create recurring event",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  // Update recurring event mutation
  const updateRecurringEventMutation = api.recurringEvent.update.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Recurring event updated successfully",
      });
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update recurring event",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      frequency: "weekly",
      interval: 1,
      daysOfWeek: [],
      hasEndDate: false,
      hasCount: false,
    },
  });

  // Update form values when existing data is loaded
  useEffect(() => {
    if (existingRecurringEvent) {
      const { recurrencePattern } = existingRecurringEvent;

      form.reset({
        frequency: recurrencePattern.frequency,
        interval: recurrencePattern.interval,
        daysOfWeek: recurrencePattern.daysOfWeek || [],
        dayOfMonth: recurrencePattern.dayOfMonth,
        monthOfYear: recurrencePattern.monthOfYear,
        endDate: recurrencePattern.endDate,
        count: recurrencePattern.count,
        hasEndDate: !!recurrencePattern.endDate,
        hasCount: !!recurrencePattern.count,
      });
    }
  }, [existingRecurringEvent, form]);

  // Handle form submission
  const onSubmit = (values: FormValues) => {
    setIsSubmitting(true);

    // Prepare recurrence pattern
    const recurrencePattern = {
      frequency: values.frequency,
      interval: values.interval,
      daysOfWeek: values.frequency === "weekly" ? values.daysOfWeek : undefined,
      dayOfMonth: (values.frequency === "monthly" || values.frequency === "yearly") ? values.dayOfMonth : undefined,
      monthOfYear: values.frequency === "yearly" ? values.monthOfYear : undefined,
      endDate: values.hasEndDate ? values.endDate : undefined,
      count: values.hasCount ? values.count : undefined,
    };

    if (existingRecurringEvent) {
      // Update existing recurring event
      updateRecurringEventMutation.mutate({
        id: existingRecurringEvent.id,
        recurrencePattern,
      });
    } else {
      // Create new recurring event
      createRecurringEventMutation.mutate({
        parentEventId: eventId,
        recurrencePattern,
      });
    }
  };

  // Day of week options
  const daysOfWeek = [
    { value: 0, label: "Sunday" },
    { value: 1, label: "Monday" },
    { value: 2, label: "Tuesday" },
    { value: 3, label: "Wednesday" },
    { value: 4, label: "Thursday" },
    { value: 5, label: "Friday" },
    { value: 6, label: "Saturday" },
  ];

  // Month options
  const months = [
    { value: 0, label: "January" },
    { value: 1, label: "February" },
    { value: 2, label: "March" },
    { value: 3, label: "April" },
    { value: 4, label: "May" },
    { value: 5, label: "June" },
    { value: 6, label: "July" },
    { value: 7, label: "August" },
    { value: 8, label: "September" },
    { value: 9, label: "October" },
    { value: 10, label: "November" },
    { value: 11, label: "December" },
  ];

  if (isLoadingRecurringEvent) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="frequency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Frequency</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                How often the event repeats
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="interval"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Interval</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                {form.watch("frequency") === "daily" && "Repeat every X days"}
                {form.watch("frequency") === "weekly" && "Repeat every X weeks"}
                {form.watch("frequency") === "monthly" && "Repeat every X months"}
                {form.watch("frequency") === "yearly" && "Repeat every X years"}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.watch("frequency") === "weekly" && (
          <FormField
            control={form.control}
            name="daysOfWeek"
            render={() => (
              <FormItem>
                <div className="mb-4">
                  <FormLabel>Days of Week</FormLabel>
                  <FormDescription>
                    Select which days of the week the event occurs
                  </FormDescription>
                </div>
                <div className="flex flex-wrap gap-4">
                  {daysOfWeek.map((day) => (
                    <FormField
                      key={day.value}
                      control={form.control}
                      name="daysOfWeek"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={day.value}
                            className="flex flex-row items-start space-x-2 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(day.value)}
                                onCheckedChange={(checked) => {
                                  const currentValue = field.value || [];
                                  if (checked) {
                                    field.onChange([...currentValue, day.value]);
                                  } else {
                                    field.onChange(
                                      currentValue.filter((value) => value !== day.value)
                                    );
                                  }
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {day.label}
                            </FormLabel>
                          </FormItem>
                        );
                      }}
                    />
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {(form.watch("frequency") === "monthly" || form.watch("frequency") === "yearly") && (
          <FormField
            control={form.control}
            name="dayOfMonth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Day of Month</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    max={31}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Which day of the month the event occurs (1-31)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {form.watch("frequency") === "yearly" && (
          <FormField
            control={form.control}
            name="monthOfYear"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Month</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  defaultValue={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {months.map((month) => (
                      <SelectItem key={month.value} value={month.value.toString()}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Which month of the year the event occurs
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="space-y-4">
          <FormField
            control={form.control}
            name="hasEndDate"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>End by date</FormLabel>
                  <FormDescription>
                    Specify an end date for the recurring event
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          {form.watch("hasEndDate") && (
            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>End Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-[240px] pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    The recurring event will end on this date
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <div className="space-y-4">
          <FormField
            control={form.control}
            name="hasCount"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>End after occurrences</FormLabel>
                  <FormDescription>
                    Specify a number of occurrences after which the event stops recurring
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          {form.watch("hasCount") && (
            <FormField
              control={form.control}
              name="count"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Occurrences</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    The recurring event will end after this many occurrences
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {existingRecurringEvent ? "Update Recurring Event" : "Create Recurring Event"}
        </Button>
      </form>
    </Form>
  );
}
