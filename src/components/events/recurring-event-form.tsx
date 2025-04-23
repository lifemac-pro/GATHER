"use client";

import { useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { CalendarIcon, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Define the form schema
const recurrenceFormSchema = z.object({
  isRecurring: z.boolean().default(false),
  frequency: z.enum(["daily", "weekly", "monthly", "yearly"]),
  interval: z.number().min(1).default(1),
  daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
  daysOfMonth: z.array(z.number().min(1).max(31)).optional(),
  monthsOfYear: z.array(z.number().min(0).max(11)).optional(),
  endDate: z.date().optional(),
  count: z.number().min(1).optional(),
  endType: z.enum(["never", "on_date", "after_occurrences"]).default("never"),
});

type RecurrenceFormValues = z.infer<typeof recurrenceFormSchema>;

interface RecurringEventFormProps {
  defaultValues?: Partial<RecurrenceFormValues>;
  onSubmit: (values: RecurrenceFormValues) => void;
}

export function RecurringEventForm({
  defaultValues,
  onSubmit,
}: RecurringEventFormProps) {
  const [showRecurringOptions, setShowRecurringOptions] = useState(
    defaultValues?.isRecurring ?? false,
  );

  // Initialize form with default values
  const form = useForm<RecurrenceFormValues>({
    resolver: zodResolver(recurrenceFormSchema),
    defaultValues: {
      isRecurring: defaultValues?.isRecurring ?? false,
      frequency: defaultValues?.frequency ?? "weekly",
      interval: defaultValues?.interval ?? 1,
      daysOfWeek: defaultValues?.daysOfWeek ?? [1], // Monday by default
      daysOfMonth: defaultValues?.daysOfMonth,
      monthsOfYear: defaultValues?.monthsOfYear,
      endDate: defaultValues?.endDate,
      count: defaultValues?.count,
      endType: defaultValues?.endType ?? "never",
    },
  });

  // Watch form values to update UI
  const frequency = form.watch("frequency");
  const endType = form.watch("endType");

  // Handle form submission
  const handleSubmit = (values: RecurrenceFormValues) => {
    // If not recurring, just return the isRecurring flag
    if (!values.isRecurring) {
      onSubmit({ isRecurring: false } as RecurrenceFormValues);
      return;
    }

    // Prepare the recurrence rule based on the form values
    const recurrenceRule: any = {
      frequency: values.frequency,
      interval: values.interval,
    };

    // Add frequency-specific fields
    if (values.frequency === "weekly" && values.daysOfWeek?.length) {
      recurrenceRule.daysOfWeek = values.daysOfWeek;
    } else if (values.frequency === "monthly" && values.daysOfMonth?.length) {
      recurrenceRule.daysOfMonth = values.daysOfMonth;
    } else if (values.frequency === "yearly" && values.monthsOfYear?.length) {
      recurrenceRule.monthsOfYear = values.monthsOfYear;
    }

    // Add end condition
    if (values.endType === "on_date" && values.endDate) {
      recurrenceRule.endDate = values.endDate;
    } else if (values.endType === "after_occurrences" && values.count) {
      recurrenceRule.count = values.count;
    }

    // Submit the form
    onSubmit({
      isRecurring: true,
      ...values,
    });
  };

  // Day of week names
  const daysOfWeek = [
    { value: 0, label: "Sun" },
    { value: 1, label: "Mon" },
    { value: 2, label: "Tue" },
    { value: 3, label: "Wed" },
    { value: 4, label: "Thu" },
    { value: 5, label: "Fri" },
    { value: 6, label: "Sat" },
  ];

  // Month names
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="isRecurring"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) => {
                    field.onChange(checked);
                    setShowRecurringOptions(!!checked);
                  }}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Recurring Event</FormLabel>
                <FormDescription>
                  Make this a recurring event that repeats on a schedule
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        {showRecurringOptions && (
          <div className="space-y-4 rounded-md border p-4">
            <h3 className="text-lg font-medium">Recurrence Settings</h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="interval"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Repeat every</FormLabel>
                    <div className="flex items-center space-x-2">
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value))
                          }
                          className="w-20"
                        />
                      </FormControl>
                      <span>
                        {frequency === "daily"
                          ? "day(s)"
                          : frequency === "weekly"
                            ? "week(s)"
                            : frequency === "monthly"
                              ? "month(s)"
                              : "year(s)"}
                      </span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Weekly options */}
            {frequency === "weekly" && (
              <FormField
                control={form.control}
                name="daysOfWeek"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Repeat on</FormLabel>
                    <div className="flex flex-wrap gap-2">
                      {daysOfWeek.map((day) => (
                        <Button
                          key={day.value}
                          type="button"
                          variant={
                            field.value?.includes(day.value)
                              ? "default"
                              : "outline"
                          }
                          className="h-10 w-10 p-0"
                          onClick={() => {
                            const currentValue = field.value || [];
                            const newValue = currentValue.includes(day.value)
                              ? currentValue.filter((d) => d !== day.value)
                              : [...currentValue, day.value];
                            field.onChange(newValue.sort());
                          }}
                        >
                          {day.label}
                        </Button>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Monthly options */}
            {frequency === "monthly" && (
              <FormField
                control={form.control}
                name="daysOfMonth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Repeat on day(s)</FormLabel>
                    <div className="flex flex-wrap gap-2">
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(
                        (day) => (
                          <Button
                            key={day}
                            type="button"
                            variant={
                              field.value?.includes(day) ? "default" : "outline"
                            }
                            className="h-10 w-10 p-0"
                            onClick={() => {
                              const currentValue = field.value || [];
                              const newValue = currentValue.includes(day)
                                ? currentValue.filter((d) => d !== day)
                                : [...currentValue, day];
                              field.onChange(newValue.sort((a, b) => a - b));
                            }}
                          >
                            {day}
                          </Button>
                        ),
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Yearly options */}
            {frequency === "yearly" && (
              <FormField
                control={form.control}
                name="monthsOfYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Repeat in month(s)</FormLabel>
                    <div className="flex flex-wrap gap-2">
                      {months.map((month) => (
                        <Button
                          key={month.value}
                          type="button"
                          variant={
                            field.value?.includes(month.value)
                              ? "default"
                              : "outline"
                          }
                          className="h-auto px-3 py-1"
                          onClick={() => {
                            const currentValue = field.value || [];
                            const newValue = currentValue.includes(month.value)
                              ? currentValue.filter((m) => m !== month.value)
                              : [...currentValue, month.value];
                            field.onChange(newValue.sort((a, b) => a - b));
                          }}
                        >
                          {month.label}
                        </Button>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* End options */}
            <FormField
              control={form.control}
              name="endType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select when to end" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="never">Never</SelectItem>
                      <SelectItem value="on_date">On date</SelectItem>
                      <SelectItem value="after_occurrences">
                        After occurrences
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {endType === "on_date" && (
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground",
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
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {endType === "after_occurrences" && (
              <FormField
                control={form.control}
                name="count"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of occurrences</FormLabel>
                    <div className="flex items-center space-x-2">
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value))
                          }
                          className="w-20"
                        />
                      </FormControl>
                      <span>occurrences</span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        )}

        <Button type="submit" className="w-full">
          <RefreshCw className="mr-2 h-4 w-4" />
          Apply Recurrence Settings
        </Button>
      </form>
    </Form>
  );
}
