"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { FormSubmission } from "@/components/ui/registration/form-submission";
import { useToast } from "@/components/ui/use-toast";
import { useUser } from "@clerk/nextjs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, Calendar, MapPin, Users, Clock } from "lucide-react";
import { format } from "date-fns";

export default function EventRegistrationPage({ params }: { params: { id: string } }) {
  // Unwrap params using React.use()
  const { id: eventId } = params;

  const router = useRouter();
  const { toast } = useToast();
  const { user, isLoaded, isSignedIn } = useUser();
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Get event details
  const { data: event, isLoading: isLoadingEvent } = api.event.getById.useQuery(
    { id: eventId },
    { enabled: !!eventId }
  );

  // Get active registration form
  const { data: form, isLoading: isLoadingForm } = api.registrationForm.getActiveByEvent.useQuery<
    { id: string } | null
  >(
    { eventId },
    { enabled: !!eventId }
  );

  // Check if user is already registered
  const { data: userRegistrations, isLoading: isLoadingRegistrations } = api.registrationSubmission.getByUser.useQuery(
    { userId: user?.id },
    { enabled: !!user?.id }
  );

  // Check if user is already registered for this event
  const isAlreadyRegistered = userRegistrations?.some(
    (registration) =>
      registration.eventId === eventId &&
      ["pending", "approved", "confirmed"].includes(registration.status)
  );

  // Redirect to login if not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn && !isRedirecting) {
      setIsRedirecting(true);
      toast({
        title: "Sign in required",
        description: "Please sign in to register for this event",
      });
      router.push(`/sign-in?redirect=/events/${eventId}/register`);
    }
  }, [isLoaded, isSignedIn, router, eventId, isRedirecting, toast]);

  // Handle successful registration
  const handleRegistrationSuccess = () => {
    router.push(`/events/${eventId}/registered`);
  };

  if (isLoadingEvent || isLoadingForm || isLoadingRegistrations || !isLoaded) {
    return (
      <div className="container mx-auto flex h-[70vh] max-w-3xl items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Loading registration form..." />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container mx-auto py-8">
        <Card className="border-destructive">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-6 w-6 text-destructive" />
              <CardTitle>Event Not Found</CardTitle>
            </div>
            <CardDescription>
              The event you&apos;re looking for doesn&apos;t exist or has been removed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/events")}>
              Back to Events
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>{event.name}</CardTitle>
            <CardDescription>
              Registration is not available for this event
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>There is no active registration form for this event.</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => router.push(`/events/${eventId}`)}>
              Back to Event
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (isAlreadyRegistered) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Already Registered</CardTitle>
            <CardDescription>
              You have already registered for this event
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              You have already submitted a registration for {event.name}. You can view your registration status in your account.
            </p>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => router.push(`/events/${eventId}`)}>
              Back to Event
            </Button>
            <Button onClick={() => router.push("/account/registrations")}>
              View My Registrations
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">{event.name}</h1>
        <div className="mb-4 flex flex-wrap gap-4">
          <div className="flex items-center text-muted-foreground">
            <Calendar className="mr-2 h-4 w-4" />
            <span>
              {format(new Date(event.startDate), "MMMM d, yyyy")}
              {event.endDate &&
                event.endDate !== event.startDate &&
                ` - ${format(new Date(event.endDate), "MMMM d, yyyy")}`}
            </span>
          </div>

          {event.location && (
            <div className="flex items-center text-muted-foreground">
              <MapPin className="mr-2 h-4 w-4" />
              <span>{event.location}</span>
            </div>
          )}

          {event.startDate && (
            <div className="flex items-center text-muted-foreground">
              <Clock className="mr-2 h-4 w-4" />
              <span>
                {format(new Date(event.startDate), "h:mm a")}
                {event.endDate &&
                  ` - ${format(new Date(event.endDate), "h:mm a")}`}
              </span>
            </div>
          )}

          {event.maxAttendees && (
            <div className="flex items-center text-muted-foreground">
              <Users className="mr-2 h-4 w-4" />
              <span>Limited to {event.maxAttendees} attendees</span>
            </div>
          )}
        </div>

        {event.description && (
          <div className="mb-6 rounded-md bg-muted/50 p-4">
            <p>{event.description}</p>
          </div>
        )}
      </div>

      <div className="space-y-6">
        <FormSubmission
          formId={form.id}
          eventId={eventId}
          userId={user?.id || ""}
          onSuccess={handleRegistrationSuccess}
        />
      </div>
    </div>
  );
}
