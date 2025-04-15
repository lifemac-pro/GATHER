"use client";

import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { AddToCalendar } from "@/components/events/add-to-calendar";
import { QRGenerator } from "@/components/qr/qr-generator";
import { PaymentProvider } from "@/components/payments/payment-provider";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EventImage } from "@/components/events/event-image";
// Using Clerk authentication instead of NextAuth
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { useState } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function EventDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  // Get user session from Clerk
  const { isSignedIn, user } = useUser();
  const [showPayment, setShowPayment] = useState(false);
  const { data: event, isLoading } = api.event.getById.useQuery({ id: params.id });
  const register = api.attendee.register.useMutation({
    onSuccess: () => {
      toast.success("Successfully registered for event!");
      setShowPayment(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Get registration status for current user
  const { data: registration, isLoading: isRegistrationLoading } = api.attendee.getRegistration.useQuery(
    { eventId: params.id },
    { enabled: !!isSignedIn && !!params.id }
  );

  // Get attendees for this event
  const { data: attendees, isLoading: isAttendeesLoading } = api.attendee.getByEvent.useQuery(
    { eventId: params.id },
    { enabled: !!params.id }
  );

  if (isLoading) {
    return (
      <div className="container px-4 sm:px-6 py-8 flex items-center justify-center min-h-[50vh]">
        <LoadingSpinner size="lg" text="Loading event details..." />
      </div>
    );
  }

  if (!event) {
    return <div>Event not found</div>;
  }

  const handleRegister = async () => {
    if (!isSignedIn) {
      toast.error("Please sign in to register");
      return;
    }

    if (event.price && event.price > 0) {
      setShowPayment(true);
    } else {
      await register.mutateAsync({
        eventId: params.id,
        name: user?.fullName || '',
        email: user?.primaryEmailAddress?.emailAddress || '',
      });
    }
  };

  const handlePaymentSuccess = async () => {
    await register.mutateAsync({
      eventId: params.id,
      name: user?.fullName || '',
      email: user?.primaryEmailAddress?.emailAddress || '',
    });
  };

  return (
    <div className="container px-4 sm:px-6 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">{event.name}</CardTitle>
          <div className="mt-2 flex flex-wrap items-center gap-4">
            <AddToCalendar
              eventId={event.id}
              name={event.name}
              description={event.description ?? ""}
              startDate={event.startDate}
              endDate={event.endDate}
              location={event.location ?? ""}
            />
            {registration && (
              <QRGenerator
                eventId={event.id}
                attendeeId={registration.id}
                eventName={event.name}
              />
            )}
          </div>
        </CardHeader>
        <CardContent>
          {event.image && (
            <div className="mb-6 max-h-[400px] overflow-hidden rounded-lg">
              <EventImage src={event.image} alt={event.name} />
            </div>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="font-semibold">Date & Time</h3>
              <p>
                {format(event.startDate, "PPP")} at{" "}
                {format(event.startDate, "p")} -{" "}
                {format(event.endDate, "p")}
              </p>
            </div>
            {event.location && (
              <div>
                <h3 className="font-semibold">Location</h3>
                <p>{event.location}</p>
              </div>
            )}
            {event.description && (
              <div>
                <h3 className="font-semibold">Description</h3>
                <p>{event.description}</p>
              </div>
            )}
            {event.price && event.price > 0 && (
              <div>
                <h3 className="font-semibold">Price</h3>
                <p>${(event.price || 0).toFixed(2)}</p>
              </div>
            )}
            {isSignedIn ? (
              registration ? (
                <div className="mt-4 rounded-md bg-green-50 p-3 text-green-800">
                  <p className="font-medium">You are registered for this event!</p>
                  <p className="text-sm">Ticket code: {registration.ticketCode}</p>
                </div>
              ) : (
                <Button
                  onClick={handleRegister}
                  disabled={register.isPending}
                  className="mt-4"
                >
                  {event.price && event.price > 0 ? "Register and Pay" : "Register for Event"}
                </Button>
              )
            ) : (
              <Button
                onClick={() => window.location.href = "/sign-in"}
                className="mt-4"
              >
                Sign in to Register
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Attendees List */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Registered Attendees</CardTitle>
        </CardHeader>
        <CardContent>
          {isAttendeesLoading ? (
            <div className="flex justify-center py-4">
              <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
            </div>
          ) : attendees && attendees.length > 0 ? (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full border-collapse">
                <thead className="hidden sm:table-header-group">
                  <tr className="border-b">
                    <th className="py-2 text-left font-medium">Name</th>
                    <th className="py-2 text-left font-medium">Email</th>
                    <th className="py-2 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendees.map((attendee) => (
                    <tr key={attendee.id} className="block border-b sm:table-row hover:bg-muted/50">
                      <td className="block py-2 sm:table-cell">
                        <span className="inline-block font-medium sm:hidden">Name: </span>
                        {attendee.name}
                      </td>
                      <td className="block py-2 sm:table-cell">
                        <span className="inline-block font-medium sm:hidden">Email: </span>
                        {attendee.email}
                      </td>
                      <td className="block py-2 sm:table-cell">
                        <span className="inline-block font-medium sm:hidden">Status: </span>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          attendee.status === 'checked-in'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {attendee.status === 'checked-in' ? 'Checked In' : 'Registered'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted-foreground">No attendees registered yet.</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Payment</DialogTitle>
          </DialogHeader>
          <PaymentProvider
            amount={event.price || 0}
            eventId={event.id}
            onSuccess={handlePaymentSuccess}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
