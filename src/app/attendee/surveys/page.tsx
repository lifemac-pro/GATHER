"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/trpc/react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { SurveyCard } from "@/components/ui/attendee/survey-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search, CheckCircle, Clock } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AttendeeSurveysPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch pending surveys for the user
  const { data: pendingSurveys, isLoading: isPendingLoading } = 
    api.attendee.getPendingSurveys.useQuery(
      undefined,
      { enabled: isLoaded && !!user }
    );

  // Fetch completed surveys for the user
  const { data: completedSurveys, isLoading: isCompletedLoading } = 
    api.attendee.getCompletedSurveys.useQuery(
      undefined,
      { enabled: isLoaded && !!user }
    );

  const isLoading = !isLoaded || isPendingLoading || isCompletedLoading;

  if (isLoading) {
    return (
      <div className="container flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" text="Loading surveys..." />
      </div>
    );
  }

  // Filter surveys based on search query
  const filterSurveys = (surveys: any[] | undefined) => {
    if (!surveys) return [];
    if (!searchQuery.trim()) return surveys;
    
    return surveys.filter(survey => 
      survey.eventName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const filteredPendingSurveys = filterSurveys(pendingSurveys);
  const filteredCompletedSurveys = filterSurveys(completedSurveys);

  return (
    <div className="container space-y-8 py-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="text-3xl font-bold text-foreground">Surveys</h1>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search surveys..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Completed
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending" className="space-y-6">
          {filteredPendingSurveys.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredPendingSurveys.map((survey) => (
                <SurveyCard
                  key={survey.id}
                  id={survey.id}
                  eventName={survey.eventName}
                  eventDate={new Date(survey.eventDate)}
                  completed={false}
                  dueDate={survey.dueDate ? new Date(survey.dueDate) : undefined}
                  onClick={() => router.push(`/attendee/surveys/${survey.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <h3 className="mb-2 text-lg font-semibold">No pending surveys</h3>
              <p className="text-muted-foreground">
                You don't have any pending surveys to complete.
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="completed" className="space-y-6">
          {filteredCompletedSurveys.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCompletedSurveys.map((survey) => (
                <SurveyCard
                  key={survey.id}
                  id={survey.id}
                  eventName={survey.eventName}
                  eventDate={new Date(survey.eventDate)}
                  completed={true}
                  onClick={() => router.push(`/attendee/surveys/${survey.id}/responses`)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <h3 className="mb-2 text-lg font-semibold">No completed surveys</h3>
              <p className="text-muted-foreground">
                You haven't completed any surveys yet.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
