"use client";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";

export default function DeleteEventPage() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get("id");

  const handleDeleteEvent = async () => {
    const response = await fetch(`/api/events/${eventId}`, { method: "DELETE" });

    if (response.ok) {
      alert("Event Deleted Successfully!");
    } else {
      alert("Failed to delete event.");
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-[#072446]">Delete Event</h1>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" className="mt-4">Delete Event</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this event.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline">Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteEvent}>Confirm</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
