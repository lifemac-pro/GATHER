"use client";

import { QRScanner } from "@/components/qr/qr-scanner";
import { api } from "@/trpc/react";
import { toast } from "sonner";

export default function CheckInPage() {
  const checkIn = api.attendee.checkIn.useMutation({
    onSuccess: () => {
      toast.success("Attendee checked in successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleScan = async (data: { eventId: string; attendeeId: string }) => {
    await checkIn.mutateAsync(data);
  };

  return (
    <div className="container py-8">
      <h1 className="mb-8 text-3xl font-bold">Check-in Scanner</h1>
      <div className="mx-auto max-w-md">
        <QRScanner onScan={handleScan} />
      </div>
    </div>
  );
}
