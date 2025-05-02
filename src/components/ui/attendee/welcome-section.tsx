"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarPlus } from "lucide-react";
import { useRouter } from "next/navigation";

interface WelcomeSectionProps {
  userName: string;
  upcomingEventsCount: number;
}

export function WelcomeSection({ userName, upcomingEventsCount }: WelcomeSectionProps) {
  const router = useRouter();
  
  return (
    <Card className="bg-gradient-to-r from-[#072446] to-[#0a3a6f] text-white">
      <CardContent className="flex flex-col space-y-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">
            Welcome, <span className="text-[#E1A913]">{userName}</span>!
          </h2>
          <p className="text-[#B0B8C5]">
            Manage your event registrations, explore upcoming events, and share your feedback.
          </p>
          <p className="text-sm text-[#00b0a6]">
            You have {upcomingEventsCount} upcoming {upcomingEventsCount === 1 ? 'event' : 'events'}.
          </p>
        </div>
        <Button 
          onClick={() => router.push("/events")}
          className="mt-4 bg-[#00b0a6] text-white hover:bg-[#00b0a6]/90 sm:mt-0"
        >
          <CalendarPlus className="mr-2 h-4 w-4" />
          Find Events
        </Button>
      </CardContent>
    </Card>
  );
}
