"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { trackUserEvent } from "@/lib/analytics-client";
import { useUser } from "@clerk/nextjs";
import { api } from "@/trpc/react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { QRCode } from "react-qrcode-logo";
import { toast } from "sonner";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Ticket,
  Download,
  Share2,
  CalendarPlus,
  Video,
  Link2,
  Key,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";

export default function AttendeeEventDetailsPage() {
  const params = useParams();
  const eventId = params.id as string;
  const router = useRouter();
  const { user, isLoaded } = useUser();

  const [showTicket, setShowTicket] = useState(false);
  const [showShare, setShowShare] = useState(false);

  // Fetch event details
  const { data: event, isLoading: isEventLoading } =
    api.event.getById.useQuery(
      { id: eventId },
      { enabled: !!eventId }
    );

  // Fetch registration status
  const { data: registration, isLoading: isRegistrationLoading } =
    api.attendee.getRegistration.useQuery(
      { eventId },
      { enabled: !!eventId && isLoaded && !!user }
    );

  const isLoading = !isLoaded || isEventLoading || isRegistrationLoading;

  // Track event view
  useEffect(() => {
    if (user?.id && event?.id && !isLoading) {
      trackUserEvent({
        userId: user.id,
        eventType: "event_view",
        properties: {
          eventId: event.id,
          eventName: event.name,
        },
      });
    }
  }, [user?.id, event?.id, isLoading, event?.name]);

  // Handle ticket download
  const handleDownloadTicket = () => {
    // In a real implementation, this would generate and download a PDF ticket
    toast.success("Ticket download started");
  };

  // Handle event sharing
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event?.name || "Event",
          text: `Check out this event: ${event?.name}`,
          url: window.location.href,
        });
      } catch (error) {
        console.error("Error sharing:", error);
        setShowShare(true);
      }
    } else {
      setShowShare(true);
    }
  };

  // Handle adding to calendar
  const handleAddToCalendar = () => {
    // In a real implementation, this would generate calendar links
    toast.success("Event added to calendar");
  };

  if (isLoading) {
    return (
      <div className="container flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" text="Loading event details..." />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container py-8">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle>Event Not Found</CardTitle>
            <CardDescription>
              The event you're looking for doesn't exist or has been removed.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push("/attendee/events")}>
              Back to Events
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Format dates for display
  const formattedStartDate = format(new Date(event.startDate), "EEEE, MMMM d, yyyy");
  const formattedStartTime = format(new Date(event.startDate), "h:mm a");
  const formattedEndTime = format(new Date(event.endDate), "h:mm a");

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "registered":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
      case "waitlisted":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100";
      case "attended":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100";
      case "pending":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100";
    }
  };

  return (
    <div className="container space-y-6 py-8">
      <Button
        variant="ghost"
        onClick={() => router.push("/attendee/events")}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Events
      </Button>

      {/* Event Header */}
      <div className="space-y-4">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <h1 className="text-3xl font-bold text-[#E1A913]">{event.name}</h1>

          {registration && (
            <Badge className={`${getStatusColor(registration.status)} capitalize`}>
              {registration.status === "checked-in" ? (
                <>
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Checked In
                </>
              ) : registration.status === "registered" ? (
                <>
                  <Ticket className="mr-1 h-3 w-3" />
                  Registered
                </>
              ) : (
                registration.status
              )}
            </Badge>
          )}
        </div>

        {/* Event Image */}
        {event.image && (
          <div className="overflow-hidden rounded-lg">
            <img
              src={event.image}
              alt={event.name}
              className="h-auto w-full object-cover"
              style={{ maxHeight: "400px" }}
            />
          </div>
        )}
      </div>

      {/* Event Details and Actions */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content - 2/3 width */}
        <div className="space-y-6 md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#00b0a6]" />
                <div>
                  <h3 className="font-medium">Date & Time</h3>
                  <p>{formattedStartDate}</p>
                  <p>
                    {formattedStartTime} - {formattedEndTime}
                  </p>
                </div>
              </div>

              {event.isVirtual ? (
                <div className="flex items-start gap-3">
                  <Video className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#00b0a6]" />
                  <div>
                    <h3 className="font-medium">Virtual Event</h3>
                    {event.virtualMeetingInfo ? (
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center">
                          <Link2 className="mr-2 h-4 w-4 text-blue-600" />
                          <a
                            href={event.virtualMeetingInfo.meetingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            Join Meeting
                          </a>
                        </div>

                        {event.virtualMeetingInfo.meetingId && (
                          <div className="flex items-center">
                            <span className="text-sm">
                              Meeting ID: {event.virtualMeetingInfo.meetingId}
                            </span>
                          </div>
                        )}

                        {event.virtualMeetingInfo.password && (
                          <div className="flex items-center">
                            <Key className="mr-2 h-4 w-4" />
                            <span className="text-sm">
                              Password: {event.virtualMeetingInfo.password}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">
                        Connection details will be provided closer to the event.
                      </p>
                    )}
                  </div>
                </div>
              ) : event.location ? (
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#00b0a6]" />
                  <div>
                    <h3 className="font-medium">Location</h3>
                    <p>{event.location}</p>
                    {/* Add a map link here */}
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(event.location)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      View on Map
                    </a>
                  </div>
                </div>
              ) : null}

              {event.maxAttendees && (
                <div className="flex items-start gap-3">
                  <Users className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#00b0a6]" />
                  <div>
                    <h3 className="font-medium">Capacity</h3>
                    <p>Limited to {event.maxAttendees} attendees</p>
                  </div>
                </div>
              )}

              {event.price && event.price > 0 && (
                <div className="flex items-start gap-3">
                  <Ticket className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#00b0a6]" />
                  <div>
                    <h3 className="font-medium">Price</h3>
                    <p>${event.price.toFixed(2)}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Tabs defaultValue="description" className="w-full">
            <TabsList>
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
              <TabsTrigger value="speakers">Speakers</TabsTrigger>
            </TabsList>
            <TabsContent value="description" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="whitespace-pre-line">{event.description}</p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="schedule" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  {event.schedule ? (
                    <div className="space-y-4">
                      {event.schedule.map((item: any, index: number) => (
                        <div key={index} className="flex gap-4 border-b pb-4 last:border-0">
                          <div className="w-24 flex-shrink-0 text-sm text-muted-foreground">
                            {item.time}
                          </div>
                          <div>
                            <h4 className="font-medium">{item.title}</h4>
                            {item.description && (
                              <p className="text-sm text-muted-foreground">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      No detailed schedule available for this event.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="speakers" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  {event.speakers ? (
                    <div className="grid gap-6 sm:grid-cols-2">
                      {event.speakers.map((speaker: any, index: number) => (
                        <div key={index} className="flex gap-4">
                          {speaker.image && (
                            <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-full">
                              <img
                                src={speaker.image}
                                alt={speaker.name}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          )}
                          <div>
                            <h4 className="font-medium">{speaker.name}</h4>
                            {speaker.title && (
                              <p className="text-sm text-muted-foreground">
                                {speaker.title}
                              </p>
                            )}
                            {speaker.bio && (
                              <p className="mt-1 text-sm">
                                {speaker.bio}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      No speaker information available for this event.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar - 1/3 width */}
        <div className="space-y-6">
          {/* Registration Status */}
          {registration ? (
            <Card className="border-[#00b0a6]">
              <CardHeader className="bg-[#00b0a6]/10 pb-2">
                <CardTitle className="text-lg text-[#00b0a6]">
                  Your Registration
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Status
                    </h3>
                    <p className="font-medium capitalize">{registration.status}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Ticket Code
                    </h3>
                    <p className="font-mono font-medium">{registration.ticketCode}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Registered On
                    </h3>
                    <p>
                      {format(new Date(registration.registeredAt), "MMMM d, yyyy")}
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-2">
                <Button
                  onClick={() => setShowTicket(true)}
                  className="w-full bg-[#00b0a6] text-white hover:bg-[#00b0a6]/90"
                >
                  <Ticket className="mr-2 h-4 w-4" />
                  View Ticket
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDownloadTicket}
                  className="w-full"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Ticket
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <Card className="border-amber-200">
              <CardHeader className="bg-amber-50 pb-2">
                <CardTitle className="flex items-center text-lg text-amber-800">
                  <AlertCircle className="mr-2 h-5 w-5" />
                  Not Registered
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-muted-foreground">
                  You are not registered for this event. Register now to secure your spot!
                </p>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={() => router.push(`/events/${eventId}`)}
                  className="w-full bg-[#00b0a6] text-white hover:bg-[#00b0a6]/90"
                >
                  Register for Event
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                onClick={handleAddToCalendar}
                className="w-full justify-start"
              >
                <CalendarPlus className="mr-2 h-4 w-4" />
                Add to Calendar
              </Button>
              <Button
                variant="outline"
                onClick={handleShare}
                className="w-full justify-start"
              >
                <Share2 className="mr-2 h-4 w-4" />
                Share Event
              </Button>
            </CardContent>
          </Card>

          {/* Organizer Info */}
          {event.organizer && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Organizer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-medium">{event.organizer.name}</p>
                  {event.organizer.description && (
                    <p className="text-sm text-muted-foreground">
                      {event.organizer.description}
                    </p>
                  )}
                  {event.organizer.email && (
                    <p className="text-sm">
                      <a
                        href={`mailto:${event.organizer.email}`}
                        className="text-blue-600 hover:underline"
                      >
                        {event.organizer.email}
                      </a>
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Ticket Dialog */}
      <Dialog open={showTicket} onOpenChange={setShowTicket}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Your Ticket</DialogTitle>
          </DialogHeader>
          {registration && (
            <div className="flex flex-col items-center space-y-4 p-4">
              <QRCode
                value={JSON.stringify({
                  type: "attendee",
                  eventId: event.id,
                  attendeeId: registration.id,
                  ticketCode: registration.ticketCode,
                })}
                size={200}
                logoImage="/logo.png"
                logoWidth={50}
                logoHeight={50}
              />
              <div className="text-center">
                <h3 className="text-xl font-bold">{event.name}</h3>
                <p className="text-muted-foreground">{formattedStartDate}</p>
                <p className="text-muted-foreground">
                  {formattedStartTime} - {formattedEndTime}
                </p>
                <div className="mt-2">
                  <p className="font-mono text-lg font-bold">{registration.ticketCode}</p>
                </div>
              </div>
              <Button
                onClick={handleDownloadTicket}
                className="mt-4 bg-[#00b0a6] text-white hover:bg-[#00b0a6]/90"
              >
                <Download className="mr-2 h-4 w-4" />
                Download Ticket
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={showShare} onOpenChange={setShowShare}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Event</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Button
              variant="outline"
              className="flex flex-col items-center justify-center p-4"
              onClick={() => {
                window.open(
                  `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                    window.location.href
                  )}`,
                  "_blank"
                );
              }}
            >
              <svg className="h-6 w-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
              </svg>
              <span className="mt-2 text-xs">Facebook</span>
            </Button>
            <Button
              variant="outline"
              className="flex flex-col items-center justify-center p-4"
              onClick={() => {
                window.open(
                  `https://twitter.com/intent/tweet?text=${encodeURIComponent(
                    `Check out this event: ${event.name}`
                  )}&url=${encodeURIComponent(window.location.href)}`,
                  "_blank"
                );
              }}
            >
              <svg className="h-6 w-6 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 10.054 10.054 0 01-3.127 1.184 4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
              </svg>
              <span className="mt-2 text-xs">Twitter</span>
            </Button>
            <Button
              variant="outline"
              className="flex flex-col items-center justify-center p-4"
              onClick={() => {
                window.open(
                  `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(
                    window.location.href
                  )}&title=${encodeURIComponent(event.name)}`,
                  "_blank"
                );
              }}
            >
              <svg className="h-6 w-6 text-blue-700" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
              <span className="mt-2 text-xs">LinkedIn</span>
            </Button>
            <Button
              variant="outline"
              className="flex flex-col items-center justify-center p-4"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success("Link copied to clipboard");
              }}
            >
              <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span className="mt-2 text-xs">Copy Link</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
