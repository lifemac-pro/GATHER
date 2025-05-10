"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, FileText, Save, Video } from "lucide-react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
// import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RecurringEventForm } from "@/components/events/recurring-event-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { ImageUpload } from "@/components/ui/image-upload";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

// Define the virtual meeting info schema
const virtualMeetingInfoSchema = z
  .object({
    provider: z.enum(["zoom", "google_meet", "microsoft_teams", "other"]),
    meetingUrl: z.string().url(),
    meetingId: z.string().optional(),
    password: z.string().optional(),
    hostUrl: z.string().url().optional(),
    additionalInfo: z.string().optional(),
  })
  .optional();

// Define the recurrence rule schema
const recurrenceRuleSchema = z
  .object({
    frequency: z.enum(["daily", "weekly", "monthly", "yearly"]),
    interval: z.number().min(1).default(1),
    daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
    daysOfMonth: z.array(z.number().min(1).max(31)).optional(),
    monthsOfYear: z.array(z.number().min(0).max(11)).optional(),
    endDate: z.date().optional(),
    count: z.number().min(1).optional(),
    exceptions: z.array(z.date()).optional(),
  })
  .optional();

// Define the form schema with all required fields
const formSchema = z.object({
  name: z.string().min(1, "Event name is required"),
  description: z.string().default(""),
  location: z.string().default(""),
  isVirtual: z.boolean().default(false),
  virtualMeetingInfo: virtualMeetingInfoSchema,
  startDate: z.date({
    required_error: "Start date is required",
  }),
  endDate: z.date({
    required_error: "End date is required",
  }),
  maxAttendees: z.number().optional(),
  category: z.string().min(1, "Category is required"),
  featured: z.boolean().default(false),
  image: z.string().default(""),
  isRecurring: z.boolean().default(false),
  recurrenceRule: recurrenceRuleSchema,
});

type FormData = z.infer<typeof formSchema>;

interface EventFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: FormData & { id: string };
}

export function EventFormDialog({
  open,
  onOpenChange,
  event,
}: EventFormDialogProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );
  const [isVirtual, setIsVirtual] = useState(false);
  const [showRecurringForm, setShowRecurringForm] = useState(false);

  // Define the form with explicit type casting to avoid resolver type errors
  const form = useForm<FormData, any, FormData>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: event || {
      name: "",
      description: "",
      location: "",
      isVirtual: false,
      virtualMeetingInfo: undefined,
      startDate: new Date(),
      endDate: new Date(new Date().getTime() + 60 * 60 * 1000), // 1 hour later
      maxAttendees: undefined,
      category: "general", // Default category
      featured: false,
      image: "",
      isRecurring: false,
      recurrenceRule: undefined,
    },
  });

  const utils = api.useUtils();

  // Get templates
  const { data: templates } = api.eventTemplate.getAll.useQuery() as {
    data: {
      description: string; id: string; name: string; duration?: number; category: string; location?: string; maxAttendees?: number; image?: string
}[] | undefined;
  };

  // Get categories
  const { data: categories } = api.event.getCategories.useQuery();

  const createEvent = api.event.create.useMutation({
    onSuccess: (data) => {
      // Invalidate the events query to refetch the data
      utils.event.getAll.invalidate();
      utils.event.getFeatured.invalidate();
      utils.event.getUpcoming.invalidate();
      router.refresh();

      // Show success message
      toast({ description: "Event created successfully", variant: "default" });

      // Close the dialog
      onOpenChange(false);
    },
    onError: (error) => {
      console.error("Create event mutation error:", error);
      toast({ description: `Failed to create event: ${error.message}`, variant: "destructive" });
    },
  });

  const updateEvent = api.event.update.useMutation({
    onSuccess: (data) => {
      // Invalidate the events query to refetch the data
      utils.event.getAll.invalidate();
      utils.event.getFeatured.invalidate();
      utils.event.getUpcoming.invalidate();
      router.refresh();

      // Show success message
      toast({ description: "Event updated successfully", variant: "default" });

      // Close the dialog
      onOpenChange(false);
    },
    onError: (error) => {
      console.error("Update event mutation error:", error);
      toast({ description: `Failed to update event: ${error.message}`, variant: "destructive" });
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      // Ensure all required fields are present
      const eventData = {
        name: data.name || "New Event", // Ensure name is never empty
        description: data.description || "",
        location: data.location || "",
        isVirtual: data.isVirtual || false,
        virtualMeetingInfo: data.isVirtual
          ? data.virtualMeetingInfo
          : undefined,
        startDate: data.startDate || new Date(),
        endDate:
          data.endDate || new Date(new Date().getTime() + 60 * 60 * 1000),
        maxAttendees: data.maxAttendees,
        category: data.category || "general", // Ensure category is never empty
        featured: data.featured || false,
        image: data.image || "",
        price: 0, // Default price
        isRecurring: data.isRecurring || false,
        recurrenceRule: data.isRecurring ? data.recurrenceRule : undefined,
      };

      console.log("Submitting event data:", {
        ...eventData,
        startDate: eventData.startDate.toISOString(),
        endDate: eventData.endDate.toISOString(),
        image: eventData.image
          ? "Image data present (truncated)"
          : "No image data",
      });

      // Try TRPC mutation first
      try {
        if (event?.id) {
          await updateEvent.mutateAsync({ id: event.id, ...eventData });
          // Success toast is handled in the mutation's onSuccess callback
        } else {
          const result = await createEvent.mutateAsync(eventData);
          console.log("Created event via TRPC:", result);
          // Success toast is handled in the mutation's onSuccess callback
        }
      } catch (mutationError) {
        console.error("TRPC mutation error:", mutationError);

        // If TRPC mutation fails, try direct API call as fallback
        if (!event?.id) {
          // Only for create, not update
          console.log("Trying direct API call as fallback");
          try {
            const response = await fetch("/api/events/create", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(eventData),
            });

            const result = await response.json();

            if (response.ok && result.success) {
              console.log("Created event via direct API:", result.data);
              toast({
                description: "Event created successfully via alternative method",
                variant: "default",
              });

              // Invalidate queries manually
              utils.event.getAll.invalidate();
              utils.event.getFeatured.invalidate();
              utils.event.getUpcoming.invalidate();
              router.refresh();
              onOpenChange(false);
              return; // Exit early on success
            } else {
              console.error("Direct API call failed:", result);
              throw new Error(result.error || "Failed to create event");
            }
          } catch (apiError) {
            console.error("Direct API error:", apiError);
            throw apiError; // Re-throw to be caught by the outer catch
          }
        } else {
          // For update, just throw the original error
          throw mutationError;
        }
      }
    } catch (error) {
      console.error("Failed to save event:", error);

      // Extract error message from TRPC error
      let errorMessage = "Failed to save event. Please try again.";
      const err = error as any;
      if (err && typeof err === "object" && "message" in err) {
        errorMessage = err.message;
        if (err.shape?.message) {
          errorMessage = err.shape.message;
        }
      }

      toast({ description: errorMessage, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form when dialog is opened or closed
  useEffect(() => {
    if (open) {
      // Reset form with default values when dialog opens
      form.reset(
        event || {
          name: "",
          description: "",
          location: "",
          startDate: new Date(),
          endDate: new Date(new Date().getTime() + 60 * 60 * 1000), // 1 hour later
          maxAttendees: undefined,
          category: "general", // Default category
          featured: false,
          image: "",
        },
      );
    }
  }, [open, event, form]);

  // Load template data when a template is selected
  useEffect(() => {
    if (selectedTemplateId && templates) {
      const template = templates.find((t) => t.id === selectedTemplateId);
      if (template) {
        // Calculate end date based on start date and duration
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setMinutes(endDate.getMinutes() + (template.duration || 60));

        // Update form with template values
        form.setValue("name", template.name);
        form.setValue("description", template.description || "");
        form.setValue("location", template.location || "");
        form.setValue("isVirtual", false);
        form.setValue("category", template.category);
        form.setValue("maxAttendees", template.maxAttendees);
        form.setValue("featured", false); // Default to false for new events
        form.setValue("image", template.image || "");
        form.setValue("startDate", startDate);
        form.setValue("endDate", endDate);

        // Show success message
        toast({ description: `Template "${template.name}" applied`, variant: "default" });

        // Reset selected template
        setSelectedTemplateId(null);
      }
    }
  }, [selectedTemplateId, templates, form]);

  // Save current event as template
  const saveAsTemplate = async () => {
    try {
      const values = form.getValues();

      // Calculate duration in minutes
      const startDate = values.startDate;
      const endDate = values.endDate;
      const durationMs = endDate.getTime() - startDate.getTime();
      const durationMinutes = Math.round(durationMs / (1000 * 60));

      // Create template
      const createTemplate = api.eventTemplate.create.useMutation();
      const result = await createTemplate.mutateAsync({
        name: values.name,
        description: values.description,
        category: values.category,
        location: values.location,
        duration: durationMinutes > 0 ? durationMinutes : 60,
        price: 0, // Default price
        maxAttendees: values.maxAttendees || 50,
        image: values.image,
      });

      toast({ description: "Event saved as template", variant: "default" });
    } catch (error) {
      console.error("Error saving template:", error);
      toast({ description: "Failed to save template", variant: "destructive" });
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        // If closing the dialog, reset the form
        if (!newOpen) {
          form.reset();
        }
        onOpenChange(newOpen);
      }}
    >
      <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#072446]">
            {event ? "Edit Event" : "Create Event"}
          </DialogTitle>
          <DialogDescription>
            Fill in the details below to {event ? "update" : "create"} an event.
            {templates && templates.length > 0 && !event && (
              <div className="mt-2">
                <Select onValueChange={(value) => setSelectedTemplateId(value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Use a template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto pr-2 max-h-[calc(90vh-180px)]">
          <Form {...form}>
            <form id="event-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Name</FormLabel>
                  <FormControl>
                    <Input
                      value={field.value || ""}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      value={field.value || ""}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
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
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
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
                          disabled={(date) =>
                            form.getValues("startDate") &&
                            date < form.getValues("startDate")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="isVirtual"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          setIsVirtual(!!checked);
                        }}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        <div className="flex items-center">
                          <Video className="mr-2 h-4 w-4" />
                          Virtual Event
                        </div>
                      </FormLabel>
                      <FormDescription>
                        This is an online event with a virtual meeting link
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {isVirtual ? "Host Location" : "Location"}
                    </FormLabel>
                    <FormControl>
                      <Input
                        value={field.value || ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                        placeholder={
                          isVirtual
                            ? "Optional host location"
                            : "Event location"
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories?.map((category) => (
                          <SelectItem key={category.name} value={category.name}>
                            {category.name} ({category.count})
                          </SelectItem>
                        )) || (
                          <>
                            <SelectItem value="general">General</SelectItem>
                            <SelectItem value="tech">Technology</SelectItem>
                            <SelectItem value="business">Business</SelectItem>
                            <SelectItem value="social">Social</SelectItem>
                            <SelectItem value="education">Education</SelectItem>
                            <SelectItem value="entertainment">
                              Entertainment
                            </SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Virtual Meeting Info */}
            {isVirtual && (
              <div className="space-y-4 rounded-md border p-4">
                <h3 className="text-lg font-medium">Virtual Meeting Details</h3>

                <FormField
                  control={form.control}
                  name="virtualMeetingInfo.provider"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meeting Provider</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a provider" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="zoom">Zoom</SelectItem>
                          <SelectItem value="google_meet">
                            Google Meet
                          </SelectItem>
                          <SelectItem value="microsoft_teams">
                            Microsoft Teams
                          </SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="virtualMeetingInfo.meetingUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meeting URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="virtualMeetingInfo.meetingId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meeting ID (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Meeting ID" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="virtualMeetingInfo.password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Meeting password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="virtualMeetingInfo.hostUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Host URL (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="virtualMeetingInfo.additionalInfo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Information (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any additional information for attendees"
                          {...field}
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Recurring Event Settings */}
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
                        setShowRecurringForm(!!checked);
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

            {showRecurringForm && (
              <RecurringEventForm
                defaultValues={{
                  isRecurring: true,
                  frequency:
                    form.getValues("recurrenceRule.frequency") || "weekly",
                  interval: form.getValues("recurrenceRule.interval") || 1,
                  daysOfWeek: form.getValues("recurrenceRule.daysOfWeek") || [
                    1,
                  ], // Monday
                  endType: form.getValues("recurrenceRule.endDate")
                    ? "on_date"
                    : form.getValues("recurrenceRule.count")
                      ? "after_occurrences"
                      : "never",
                  endDate: form.getValues("recurrenceRule.endDate"),
                  count: form.getValues("recurrenceRule.count"),
                }}
                onSubmit={(values) => {
                  if (values.isRecurring) {
                    // Create recurrence rule from form values
                    const recurrenceRule: any = {
                      frequency: values.frequency,
                      interval: values.interval,
                    };

                    // Add frequency-specific fields
                    if (
                      values.frequency === "weekly" &&
                      values.daysOfWeek?.length
                    ) {
                      recurrenceRule.daysOfWeek = values.daysOfWeek;
                    } else if (
                      values.frequency === "monthly" &&
                      values.daysOfMonth?.length
                    ) {
                      recurrenceRule.daysOfMonth = values.daysOfMonth;
                    } else if (
                      values.frequency === "yearly" &&
                      values.monthsOfYear?.length
                    ) {
                      recurrenceRule.monthsOfYear = values.monthsOfYear;
                    }

                    // Add end condition
                    if (values.endType === "on_date" && values.endDate) {
                      recurrenceRule.endDate = values.endDate;
                    } else if (
                      values.endType === "after_occurrences" &&
                      values.count
                    ) {
                      recurrenceRule.count = values.count;
                    }

                    // Update form
                    form.setValue("isRecurring", true);
                    form.setValue("recurrenceRule", recurrenceRule);
                  } else {
                    // Clear recurrence settings
                    form.setValue("isRecurring", false);
                    form.setValue("recurrenceRule", undefined);
                  }
                }}
              />
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="maxAttendees"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Attendees</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        value={field.value === undefined ? "" : field.value}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value
                              ? parseInt(e.target.value)
                              : undefined,
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="featured"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Featured Event</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Featured events appear on the homepage
                      </p>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Image</FormLabel>
                  <FormControl>
                    <ImageUpload
                      value={field.value || ""}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            </form>
          </Form>
        </div>

        <DialogFooter>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>

            {!event && (
              <Button
                type="button"
                variant="outline"
                onClick={saveAsTemplate}
              >
                <FileText className="mr-2 h-4 w-4" />
                Save as Template
              </Button>
            )}
          </div>

          <Button
            type="submit"
            form={form.formState.formId || "event-form"}
            className="bg-[#E1A913] text-[#072446] hover:bg-[#E1A913]/90"
            disabled={
              isSubmitting || createEvent.isPending || updateEvent.isPending
            }
          >
            {isSubmitting ||
            createEvent.isPending ||
            updateEvent.isPending ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                {event ? "Updating..." : "Creating..."}
              </>
            ) : event ? (
              "Update Event"
            ) : (
              "Create Event"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
