"use client";

import { useState } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  Download,
  MoreHorizontal,
  Search,
  Send,
  UserCheck
} from "lucide-react";
import Link from "next/link";

export default function EventAttendeesPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  // Get event details
  const { data: event, isLoading: isEventLoading } = api.event.getById.useQuery({
    id: params.id
  });

  // Get attendees for this event
  const { data: attendees, isLoading: isAttendeesLoading } = api.attendee.getByEvent.useQuery({
    eventId: params.id
  });

  // Check-in mutation
  const checkIn = api.attendee.checkIn.useMutation({
    onSuccess: () => {
      toast.success("Attendee checked in successfully");
      // Refetch attendees to update the list
      utils.attendee.getByEvent.invalidate({ eventId: params.id });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to check in attendee");
    }
  });

  const utils = api.useUtils();

  // Filter attendees based on search query
  const filteredAttendees = attendees?.filter(attendee => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    return (
      attendee.name?.toLowerCase().includes(query) ||
      attendee.email?.toLowerCase().includes(query) ||
      attendee.ticketCode?.toLowerCase().includes(query)
    );
  });

  // Handle check-in
  const handleCheckIn = async (attendeeId: string) => {
    await checkIn.mutateAsync({ attendeeId });
  };

  if (isEventLoading) {
    return (
      <div className="container px-4 sm:px-6 py-8">
        <LoadingSpinner size="lg" text="Loading event details..." className="min-h-[50vh]" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container px-4 sm:px-6 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold">Event not found</h2>
              <p className="mt-2 text-muted-foreground">
                The event you are looking for does not exist or has been removed.
              </p>
              <Button
                className="mt-4"
                onClick={() => router.push("/admin/events")}
              >
                Back to Events
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container px-4 sm:px-6 py-8">
      <div className="mb-6">
        <Link href="/admin/events" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Events
        </Link>
      </div>

      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold">{event.name} - Attendees</h1>
          <p className="text-muted-foreground">
            {format(new Date(event.startDate), "PPP")} at {format(new Date(event.startDate), "p")}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 sm:gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search attendees..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Actions
                <MoreHorizontal className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="cursor-pointer">
                <UserCheck className="mr-2 h-4 w-4" />
                Check in all
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Send className="mr-2 h-4 w-4" />
                Send reminder
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Download className="mr-2 h-4 w-4" />
                Export to CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle>Registered Attendees</CardTitle>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 sm:mt-0">
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded-full bg-green-500"></div>
                <span className="text-sm text-muted-foreground">Checked In</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                <span className="text-sm text-muted-foreground">Registered</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded-full bg-red-500"></div>
                <span className="text-sm text-muted-foreground">Cancelled</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isAttendeesLoading ? (
            <div className="py-8">
              <LoadingSpinner size="md" text="Loading attendees..." />
            </div>
          ) : filteredAttendees && filteredAttendees.length > 0 ? (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <Table className="min-w-[800px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Ticket Code</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Registration Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAttendees.map((attendee) => (
                    <TableRow key={attendee.id}>
                      <TableCell className="font-medium">{attendee.name}</TableCell>
                      <TableCell>{attendee.email}</TableCell>
                      <TableCell>
                        <code className="rounded bg-muted px-1 py-0.5 font-mono text-sm">
                          {attendee.ticketCode}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            attendee.status === "checked-in"
                              ? "bg-green-100 text-green-800"
                              : attendee.status === "registered"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-red-100 text-red-800"
                          }
                        >
                          {attendee.status === "checked-in"
                            ? "Checked In"
                            : attendee.status === "registered"
                            ? "Registered"
                            : "Cancelled"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {attendee.registeredAt
                          ? format(new Date(attendee.registeredAt), "PPP")
                          : "N/A"}
                      </TableCell>
                      <TableCell className="text-right">
                        {attendee.status !== "checked-in" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCheckIn(attendee.id)}
                            disabled={checkIn.isPending}
                          >
                            <Check className="mr-1 h-4 w-4" />
                            Check In
                          </Button>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            Checked in at{" "}
                            {attendee.checkedInAt
                              ? format(new Date(attendee.checkedInAt), "p")
                              : "N/A"}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">No attendees found</p>
              {searchQuery && (
                <Button
                  variant="link"
                  onClick={() => setSearchQuery("")}
                  className="mt-2"
                >
                  Clear search
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
