"use client";

import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, CheckCircle, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";

export default function RegistrationConfirmationPage({ params }: { params: { id: string } }) {
  const router = useRouter();

  // Get event details
  const { data: event, isLoading } = api.event.getById.useQuery(
    { id: params.id },
    { enabled: !!params.id }
  );

  if (isLoading) {
    return (
      <div className="container mx-auto flex h-[70vh] max-w-3xl items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Loading confirmation..." />
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

  return (
    <div className="container mx-auto max-w-3xl py-12">
      <Card className="border-green-100 bg-green-50 dark:border-green-900 dark:bg-green-950/30">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <CardTitle>Successfully Registered!</CardTitle>
          </div>
          <CardDescription>
            You have successfully registered for {event.name}. You can now view this event in your events list.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-white p-6 shadow-sm dark:bg-gray-950">
            <h2 className="mb-4 text-xl font-bold">{event.name}</h2>
            
            <div className="mb-4 space-y-2">
              <div className="flex items-center">
                <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>
                  {format(new Date(event.startDate), "MMMM d, yyyy")}
                  {event.endDate &&
                    event.endDate !== event.startDate &&
                    ` - ${format(new Date(event.endDate), "MMMM d, yyyy")}`}
                </span>
              </div>
              
              {event.startTime && (
                <div className="flex items-center">
                  <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>
                    {format(new Date(`2000-01-01T${event.startTime}`), "h:mm a")}
                    {event.endTime &&
                      ` - ${format(new Date(`2000-01-01T${event.endTime}`), "h:mm a")}`}
                  </span>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              <div className="rounded-md bg-green-100 p-4 dark:bg-green-900/30">
                <p className="font-medium text-green-800 dark:text-green-100">Registration Status</p>
                <p className="mt-1 text-sm text-green-700 dark:text-green-200">
                  Your registration has been confirmed. You can view the event details and status in your events list.
                </p>
              </div>
              
              <div className="rounded-md bg-muted/30 p-4">
                <p className="font-medium">What happens next?</p>
                <ul className="ml-6 list-disc space-y-1 text-sm">
                  <li>You will receive a confirmation email with the details of your registration.</li>
                  <li>If approval is required, you will be notified once your registration is reviewed.</li>
                  <li>You can view your registration status in your account at any time.</li>
                  <li>Add the event to your calendar to make sure you don't miss it!</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.push(`/events/${params.id}`)}>
            Back to Event
          </Button>
          <Button 
            onClick={() => router.push("/attendee/events")}
            className="bg-[#00b0a6] text-white hover:bg-[#00b0a6]/90"
          >
            View My Events
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
