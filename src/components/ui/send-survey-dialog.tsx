"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface SendSurveyDialogProps {
  selectedAttendees: number[];
  attendees: { id: number; name: string; email: string; phone: string }[];
}

export default function SendSurveyDialog({ selectedAttendees, attendees }: SendSurveyDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleSendSurvey = async () => {
    setLoading(true);

    // Get selected attendee emails & phone numbers
    const selected = attendees.filter((a) => selectedAttendees.includes(a.id));
    const emails = selected.map((a) => a.email);
    const phones = selected.map((a) => a.phone);
    const surveyLink = "https://gatherease.com/survey"; // Replace with actual dynamic survey link

    // Call backend API to send emails & SMS
    const response = await fetch("/api/send-survey", {
      method: "POST",
      body: JSON.stringify({ emails, phones, surveyLink }),
      headers: { "Content-Type": "application/json" },
    });

    if (response.ok) {
      alert("Survey sent successfully!");
    } else {
      alert("Failed to send survey.");
    }
    setLoading(false);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button disabled={selectedAttendees.length === 0} className="mt-4 bg-[#00b0a6] text-white">
          Send Survey to Attendees
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Survey</DialogTitle>
        </DialogHeader>
        <p>Survey link will be sent via Email and SMS to selected attendees.</p>
        <Button onClick={handleSendSurvey} className="mt-4 bg-[#00b0a6] text-white" disabled={loading}>
          {loading ? "Sending..." : "Send Now"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
