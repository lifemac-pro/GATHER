"use client";

import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { AddToCalendar } from "@/components/events/add-to-calendar";
import { QRGenerator } from "@/components/qr/qr-generator";
import { PaymentProvider } from "@/components/payments/payment-provider";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useState } from "react";

export default function EventDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const { data: session } = useSession();
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

  const { data: registration } = api.attendee.getRegistration.useQuery({
    eventId: params.id,
    userId: session?.user?.id ?? "",
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!event) {
    return <div>Event not found</div>;
  }

  const handleRegister = async () => {
    if (!session) {
      toast.error("Please sign in to register");
      return;
    }

    if (event.price && event.price > 0) {
      setShowPayment(true);
    } else {
      await register.mutateAsync({
        eventId: params.id,
        userId: session.user.id,
      });
    }
  };

  const handlePaymentSuccess = async () => {
    await register.mutateAsync({
      eventId: params.id,
      userId: session.user.id,
    });
  };

  return (
    <div className="container py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">{event.name}</CardTitle>
          <div className="mt-2 flex items-center gap-4">
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
          <div className="grid gap-4">
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
            {event.price > 0 && (
              <div>
                <h3 className="font-semibold">Price</h3>
                <p>${event.price.toFixed(2)}</p>
              </div>
            )}
            {!registration && (
              <Button
                onClick={handleRegister}
                disabled={register.isLoading}
                className="mt-4"
              >
                {event.price > 0 ? "Register and Pay" : "Register for Event"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Payment</DialogTitle>
          </DialogHeader>
          <PaymentProvider
            amount={event.price}
            eventId={event.id}
            onSuccess={handlePaymentSuccess}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
