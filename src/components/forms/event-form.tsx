"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useZodForm, useFormSubmit } from "@/utils/form-validation";
import { createEventSchema, CreateEventRequest, updateEventSchema, UpdateEventRequest } from "@/types/api-requests";
import { EventResponse } from "@/types/api-responses";
import { api } from "@/trpc/react";
import { ImageUpload } from "@/components/ui/image-upload";

interface EventFormProps {
  event?: EventResponse;
  mode: "create" | "edit";
}

export function EventForm({ event, mode }: EventFormProps) {
  const router = useRouter();
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);

  // Initialize form with event data if in edit mode
  const initialValues = event
    ? {
        name: event.name,
        description: event.description || "",
        location: event.location || "",
        startDate: event.startDate.toString(),
        endDate: event.endDate.toString(),
        category: event.category,
        price: event.price || 0,
        maxAttendees: event.maxAttendees && Array.isArray(event.maxAttendees) && event.maxAttendees.length > 0 ? parseInt(event.maxAttendees[0] || "0", 10) : undefined,
        image: event.image || "",
      }
    : {
        name: "",
        description: "",
        location: "",
        startDate: new Date().toString(),
        endDate: new Date().toString(),
        category: "",
        price: 0,
        maxAttendees: undefined,
        image: "",
      };

  // Use the appropriate schema based on mode
  const schema = mode === "create" ? createEventSchema : updateEventSchema;

  // Initialize form with Zod validation
  const {
    data,
    errors,
    setValue,
    handleSubmit,
  } = useZodForm(schema as any, initialValues);

  // TRPC mutations
  const createEvent = api.event.create.useMutation();
  const updateEventMutation = api.event.update.useMutation();

  // Form submission handler
  const { submit, isSubmitting, error } = useFormSubmit(
    async (formData) => {
      if (mode === "create") {
        // Process form data with proper type safety
        const typedData = formData as {
          name: string;
          description?: string;
          location?: string;
          startDate: string | Date;
          endDate: string | Date;
          category: string;
          price?: number;
          maxAttendees?: number;
          image?: string;
        };

        // Convert string dates to Date objects
        const processedData = {
          name: typedData.name,
          description: typedData.description,
          location: typedData.location,
          startDate: new Date(typedData.startDate.toString()),
          endDate: new Date(typedData.endDate.toString()),
          category: typedData.category,
          price: typedData.price,
          maxAttendees: typedData.maxAttendees,
          image: typedData.image
        };

        const result = await createEvent.mutateAsync(processedData as any);
        return result;
      } else {
        if (!event) throw new Error("Event is required for edit mode");
        // Process form data with proper type safety
        const typedData = formData as {
          name?: string;
          description?: string;
          location?: string;
          startDate?: string | Date;
          endDate?: string | Date;
          category?: string;
          price?: number;
          maxAttendees?: number;
          image?: string;
          featured?: boolean;
          status?: string;
        };

        // Convert string dates to Date objects
        const processedData = {
          name: typedData.name,
          description: typedData.description,
          location: typedData.location,
          startDate: typedData.startDate ? new Date(typedData.startDate.toString()) : undefined,
          endDate: typedData.endDate ? new Date(typedData.endDate.toString()) : undefined,
          category: typedData.category,
          price: typedData.price,
          maxAttendees: typedData.maxAttendees,
          image: typedData.image,
          featured: typedData.featured,
          status: typedData.status
        };

        const result = await updateEventMutation.mutateAsync({
          id: event.id,
          ...processedData,
        } as any);
        return result;
      }
    },
    {
      onSuccess: (data) => {
        router.push(`/events/${data.id}`);
      },
    }
  );

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Event Name *
          </label>
          <Input
            id="name"
            value={data.name || ""}
            onChange={(e) => setValue("name", e.target.value)}
            className={cn(errors.name && "border-red-500")}
          />
          {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <Textarea
            id="description"
            value={data.description || ""}
            onChange={(e) => setValue("description", e.target.value)}
            rows={4}
            className={cn(errors.description && "border-red-500")}
          />
          {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
        </div>

        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700">
            Location
          </label>
          <Input
            id="location"
            value={data.location || ""}
            onChange={(e) => setValue("location", e.target.value)}
            className={cn(errors.location && "border-red-500")}
          />
          {errors.location && <p className="mt-1 text-sm text-red-500">{errors.location}</p>}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
              Start Date *
            </label>
            <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !data.startDate && "text-muted-foreground",
                    errors.startDate && "border-red-500"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {data.startDate ? (
                    format(new Date(data.startDate), "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={data.startDate ? new Date(data.startDate) : undefined}
                  onSelect={(date) => {
                    if (date) {
                      setValue("startDate", date.toISOString() as any);
                      setStartDateOpen(false);
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {errors.startDate && <p className="mt-1 text-sm text-red-500">{errors.startDate}</p>}
          </div>

          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
              End Date *
            </label>
            <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !data.endDate && "text-muted-foreground",
                    errors.endDate && "border-red-500"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {data.endDate ? (
                    format(new Date(data.endDate), "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={data.endDate ? new Date(data.endDate) : undefined}
                  onSelect={(date) => {
                    if (date) {
                      setValue("endDate", date.toISOString() as any);
                      setEndDateOpen(false);
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {errors.endDate && <p className="mt-1 text-sm text-red-500">{errors.endDate}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">
              Category *
            </label>
            <Input
              id="category"
              value={data.category || ""}
              onChange={(e) => setValue("category", e.target.value)}
              className={cn(errors.category && "border-red-500")}
            />
            {errors.category && <p className="mt-1 text-sm text-red-500">{errors.category}</p>}
          </div>

          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700">
              Price
            </label>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              value={data.price?.toString() || "0"}
              onChange={(e) => setValue("price", parseFloat(e.target.value))}
              className={cn(errors.price && "border-red-500")}
            />
            {errors.price && <p className="mt-1 text-sm text-red-500">{errors.price}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="maxAttendees" className="block text-sm font-medium text-gray-700">
              Max Attendees
            </label>
            <Input
              id="maxAttendees"
              type="number"
              min="1"
              value={data.maxAttendees?.toString() || ""}
              onChange={(e) => setValue("maxAttendees", parseInt(e.target.value, 10))}
              className={cn(errors.maxAttendees && "border-red-500")}
            />
            {errors.maxAttendees && <p className="mt-1 text-sm text-red-500">{errors.maxAttendees}</p>}
          </div>

          <div>
            <ImageUpload
              value={data.image || ""}
              onChange={(value) => setValue("image", value)}
              label="Event Image"
            />
            {errors.image && <p className="mt-1 text-sm text-red-500">{errors.image}</p>}
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : mode === "create" ? "Create Event" : "Update Event"}
        </Button>
      </div>
    </form>
  );
}
