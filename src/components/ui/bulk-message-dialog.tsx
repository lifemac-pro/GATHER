"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface BulkMessageDialogProps {
  selectedAttendees: number[];
  attendees: { id: number; name: string; phone: string; email: string }[];
}

export default function BulkMessageDialog({ selectedAttendees, attendees }: BulkMessageDialogProps) {
  const [message, setMessage] = useState("");

  const handleSendMessage = async () => {
    const selectedNumbers = attendees.filter((a) => selectedAttendees.includes(a.id)).map((a) => a.phone);
    
    console.log("Sending message to:", selectedNumbers, "Message:", message);

    // TODO: Replace with actual API call
    alert("Message sent successfully!");
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button disabled={selectedAttendees.length === 0} className="mt-4 bg-[#00b0a6] text-white">
          Send Bulk Message
        </Button>
        
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Bulk Message</DialogTitle>
        </DialogHeader>
        <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type your message..." />
        <Button onClick={handleSendMessage} className="mt-4 bg-[#00b0a6] text-white">
          Send Message
        </Button>
      </DialogContent>
    </Dialog>
  );
}
