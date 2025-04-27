"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { SurveyTemplateForm } from "@/components/ui/survey/survey-template-form";
import { ArrowLeft } from "lucide-react";

export default function CreateSurveyPage() {
  const router = useRouter();
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  
  // Fetch all events for the dropdown
  const { data: events, isLoading } = api.event.getAll.useQuery();
  
  if (isLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-lg font-medium">Loading events...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.push("/admin/surveys")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold text-[#072446]">Create Survey</h1>
      </div>
      
      {!selectedEventId ? (
        <Card>
          <CardHeader>
            <CardTitle>Select an Event</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Select an event to create a survey for:
              </p>
              
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {events?.map((event) => (
                  <Card 
                    key={event.id}
                    className="cursor-pointer transition-all hover:border-primary hover:shadow-md"
                    onClick={() => setSelectedEventId(event.id)}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <h3 className="font-medium">{event.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(event.startDate).toLocaleDateString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {events?.length === 0 && (
                  <div className="col-span-full rounded-md border border-dashed p-8 text-center">
                    <p className="text-muted-foreground">
                      No events found. Create an event first to add a survey.
                    </p>
                    <Button 
                      className="mt-4"
                      onClick={() => router.push("/admin/events/create")}
                    >
                      Create Event
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <SurveyTemplateForm 
          eventId={selectedEventId} 
          onSuccess={() => {
            router.push("/admin/surveys");
          }}
        />
      )}
    </div>
  );
}
