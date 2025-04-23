"use client";

import {
  AwaitedReactNode,
  JSXElementConstructor,
  Key,
  ReactElement,
  ReactNode,
  ReactPortal,
  useState,
  useEffect,
} from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Search, Filter, Calendar, MapPin, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { EventImage } from "@/components/events/event-image";
import { api } from "@/trpc/react";
import { format, isValid } from "date-fns";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EventFormDialog } from "@/components/ui/admin/event-form-dialog";
import { EventTemplateDialog } from "@/components/ui/admin/event-template-dialog";
import { useRouter } from "next/navigation";

// Helper function to safely format dates
const formatDate = (date: any, formatString: string): string => {
  if (!date) return "No date";

  // If it's a string, try to convert it to a Date object
  const dateObj = typeof date === "string" ? new Date(date) : date;

  // Check if the date is valid
  if (!isValid(dateObj)) return "Invalid date";

  // Format the date
  try {
    return format(dateObj, formatString);
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Date error";
  }
};

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";

export default function EventsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  const { toast } = useToast();

  // Fetch events from the API
  const { data: events, isLoading, refetch } = api.event.getAll.useQuery();

  // Log events for debugging
  console.log("Events from API:", events);

  // Force a refetch on initial load
  useEffect(() => {
    console.log("Initial load, fetching events...");
    refetch();
  }, [refetch]);

  // Refetch events after mutations
  const utils = api.useUtils();
  const deleteEvent = api.event.delete.useMutation({
    onSuccess: () => {
      toast({
        title: "Event deleted",
        description: "The event has been successfully deleted.",
      });
      setDeleteDialogOpen(false);

      // Invalidate the events query to refetch the data
      utils.event.getAll.invalidate();
    },
    onError: (error) => {
      console.error("Error deleting event:", error);
      toast({
        title: "Error",
        description: `Failed to delete event: ${error.message}`,
        variant: "destructive",
      });
      setDeleteDialogOpen(false);
    },
  });

  const handleEdit = (event: any) => {
    console.log("Editing event:", event.id);
    setSelectedEvent(event);
    setFormDialogOpen(true);
  };

  const handleDelete = (event: any) => {
    setSelectedEvent(event);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedEvent) {
      try {
        console.log("Attempting to delete event with ID:", selectedEvent.id);
        await deleteEvent.mutateAsync({ id: selectedEvent.id });
        console.log("Event deletion successful");

        // Force a refetch to ensure the UI is updated
        await refetch();

        // Show success message
        toast({
          title: "Success",
          description: "Event has been successfully deleted.",
        });
      } catch (error) {
        console.error("Error in confirmDelete:", error);
        // Error is handled by the onError callback in the mutation
      }
    } else {
      console.error("No event selected for deletion");
      toast({
        title: "Error",
        description: "No event selected for deletion",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-4 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="text-3xl font-bold text-[#072446]">Events</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setTemplateDialogOpen(true);
            }}
          >
            <FileText className="mr-2 h-4 w-4" />
            Templates
          </Button>

          <Button
            className="bg-[#E1A913] text-[#072446] hover:bg-[#E1A913]/90"
            onClick={() => {
              setSelectedEvent(null);
              setFormDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Event
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative w-full sm:flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              // Refresh TRPC events
              refetch();
              toast({
                title: "Events refreshed",
                description: "Event list has been refreshed.",
              });
            }}
          >
            Refresh Events
          </Button>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </div>
      </div>

      {/* Events Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" text="Loading events..." />
        </div>
      ) : events?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-center">
            <h3 className="text-lg font-medium">No events found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new event.
            </p>
            <Button
              onClick={() => {
                setSelectedEvent(null);
                setFormDialogOpen(true);
              }}
              className="mt-4"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Event
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Display events */}
          {events?.map((event: any, index: number) => (
            <Card
              key={event.id || `event-${index}`}
              className="overflow-hidden"
            >
              <EventImage
                src={event.image}
                alt={event.name || `Event ${index + 1}`}
              />
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-[#072446]">
                      {event.name}
                    </h3>
                    <div className="mt-2 space-y-1 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-[#00b0a6]" />
                        <span>
                          {formatDate(
                            event.startDate,
                            "MMM d, yyyy 'at' h:mm a",
                          )}
                        </span>
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-[#00b0a6]" />
                          <span>{event.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
                        {
                          "bg-green-100 text-green-700":
                            event.status === "published" || !event.status,
                          "bg-yellow-100 text-yellow-700":
                            event.status === "draft",
                          "bg-red-100 text-red-700":
                            event.status === "cancelled",
                          "bg-gray-100 text-gray-700":
                            event.status === "completed",
                        },
                      )}
                    >
                      {event.status
                        ? event.status.charAt(0).toUpperCase() +
                          event.status.slice(1)
                        : "Published"}
                    </span>
                  </div>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                  {event.description}
                </p>
                <div className="mt-4 flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/events/${event.id}`)}
                  >
                    View Event
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      router.push(`/admin/events/${event.id}/attendees`)
                    }
                  >
                    View Attendees
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(event)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => handleDelete(event)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Event Dialog */}
      <EventFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        event={selectedEvent}
      />

      {/* Event Templates Dialog */}
      <EventTemplateDialog
        open={templateDialogOpen}
        onOpenChange={setTemplateDialogOpen}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the event. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={confirmDelete}
              disabled={deleteEvent.isPending}
            >
              {deleteEvent.isPending ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
