"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { ImageUpload } from "@/components/ui/image-upload";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// Define the form schema with all required fields
const formSchema = z.object({
  name: z.string().min(1, "Event name is required"),
  description: z.string().default(""),
  location: z.string().default(""),
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

  // Define the form with explicit type casting to avoid resolver type errors
  const form = useForm<FormData, any, FormData>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: event || {
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
  });

  const utils = api.useUtils();

  const createEvent = api.event.create.useMutation({
    onSuccess: () => {
      // Invalidate the events query to refetch the data
      utils.event.getAll.invalidate();
      utils.event.getFeatured.invalidate();
      utils.event.getUpcoming.invalidate();
      router.refresh();
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Create event mutation error:', error);
      toast.error(`Failed to create event: ${error.message}`);
    }
  });

  const updateEvent = api.event.update.useMutation({
    onSuccess: () => {
      // Invalidate the events query to refetch the data
      utils.event.getAll.invalidate();
      utils.event.getFeatured.invalidate();
      utils.event.getUpcoming.invalidate();
      router.refresh();
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Update event mutation error:', error);
      toast.error(`Failed to update event: ${error.message}`);
    }
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      // Ensure all required fields are present
      const eventData = {
        name: data.name || "New Event", // Ensure name is never empty
        description: data.description || "",
        location: data.location || "",
        startDate: data.startDate || new Date(),
        endDate: data.endDate || new Date(new Date().getTime() + 60 * 60 * 1000),
        maxAttendees: data.maxAttendees,
        category: data.category || "general", // Ensure category is never empty
        featured: data.featured || false,
        image: data.image || "",
        price: 0, // Default price
      };

      console.log('Submitting event data:', {
        ...eventData,
        startDate: eventData.startDate.toISOString(),
        endDate: eventData.endDate.toISOString(),
        image: eventData.image ? 'Image data present (truncated)' : 'No image data'
      });

      // Try TRPC mutation first
      try {
        if (event?.id) {
          await updateEvent.mutateAsync({ id: event.id, ...eventData });
          toast.success("Event updated successfully");
        } else {
          const result = await createEvent.mutateAsync(eventData);
          console.log("Created event via TRPC:", result);
          toast.success("Event created successfully");
        }
      } catch (mutationError) {
        console.error("TRPC mutation error:", mutationError);

        // If TRPC mutation fails, try direct API call as fallback
        if (!event?.id) { // Only for create, not update
          console.log("Trying direct API call as fallback");
          try {
            const response = await fetch('/api/events/create', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(eventData),
            });

            const result = await response.json();

            if (response.ok && result.success) {
              console.log("Created event via direct API:", result.data);
              toast.success("Event created successfully via alternative method");

              // Invalidate queries manually
              utils.event.getAll.invalidate();
              utils.event.getFeatured.invalidate();
              utils.event.getUpcoming.invalidate();
              router.refresh();
              onOpenChange(false);
              return; // Exit early on success
            } else {
              console.error("Direct API call failed:", result);
              throw new Error(result.error || 'Failed to create event');
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
      if (err && typeof err === 'object' && 'message' in err) {
        errorMessage = err.message;
        if (err.shape?.message) {
          errorMessage = err.shape.message;
        }
      }

      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form when dialog is opened or closed
  useEffect(() => {
    if (open) {
      // Reset form with default values when dialog opens
      form.reset(event || {
        name: "",
        description: "",
        location: "",
        startDate: new Date(),
        endDate: new Date(new Date().getTime() + 60 * 60 * 1000), // 1 hour later
        maxAttendees: undefined,
        category: "general", // Default category
        featured: false,
        image: "",
      });
    }
  }, [open, event, form]);

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      // If closing the dialog, reset the form
      if (!newOpen) {
        form.reset();
      }
      onOpenChange(newOpen);
    }}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#072446]">
            {event ? "Edit Event" : "Create Event"}
          </DialogTitle>
          <DialogDescription>
            Fill in the details below to {event ? "update" : "create"} an event.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Name</FormLabel>
                  <FormControl>
                    <Input value={field.value || ''} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} />
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
                    <Textarea value={field.value || ''} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} />
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
                          disabled={(date) =>
                            date < new Date() || (form.getValues("endDate") && date > form.getValues("endDate"))
                          }
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
                          disabled={(date) =>
                            form.getValues("startDate") && date < form.getValues("startDate")
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
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input value={field.value || ''} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} />
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
                    <FormControl>
                      <Input value={field.value || ''} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                        value={field.value === undefined ? '' : field.value}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? parseInt(e.target.value) : undefined
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
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 mt-1"
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

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#E1A913] text-[#072446] hover:bg-[#E1A913]/90"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Saving..."
                  : event
                  ? "Update Event"
                  : "Create Event"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
