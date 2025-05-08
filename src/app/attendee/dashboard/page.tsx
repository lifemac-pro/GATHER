"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/trpc/react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { WelcomeSection } from "@/components/ui/attendee/welcome-section";
import { EventCard } from "@/components/ui/attendee/event-card";
import { SurveyCard } from "@/components/ui/attendee/survey-card";
import { NotificationCard } from "@/components/ui/attendee/notification-card";
import { Button } from "@/components/ui/button";
import {
  ResponsiveContainer,
  ResponsiveGrid,
  ResponsiveSection
} from "@/components/ui/attendee/responsive-container";
import { useRouter } from "next/navigation";
import { CalendarDays, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";


export default function AttendeeDashboardPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [viewAll, setViewAll] = useState(false);

  // Fetch all dashboard data in a single query
  const { data: dashboardData, isLoading: isDashboardLoading } =
    api.attendee.getDashboardData.useQuery(
      undefined,
      { enabled: isLoaded && !!user }
    );

  const isLoading = !isLoaded || isDashboardLoading;

  if (isLoading) {
    return (
      <div className="container flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  const firstName = user?.firstName || user?.username || "there";
  const upcomingEvents = dashboardData?.upcomingEvents || [];
  const pendingSurveys = dashboardData?.pendingSurveys || [];
  const notifications = dashboardData?.notifications || [];
  const upcomingEventsCount = upcomingEvents.length;
  const displayEvents = viewAll ? upcomingEvents : upcomingEvents.slice(0, 3);

  return (
    <div className="container space-y-8 py-8">
      {/* Welcome Section */}
      <div className="rounded-lg bg-[#00b0a6] p-6 text-white">
        <h1 className="text-2xl font-bold">Welcome back, {firstName}!</h1>
        <p className="mt-2">
          You have {upcomingEventsCount} upcoming event{upcomingEventsCount !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Upcoming Events Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Upcoming Events</CardTitle>
          <Button
            variant="outline"
            onClick={() => router.push("/attendee/events")}
          >
            View All
          </Button>
        </CardHeader>
        <CardContent>
          {upcomingEventsCount > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {displayEvents.map((event) => (
                <EventCard
                  key={event.id}
                  id={event.id}
                  name={event.name}
                  startDate={new Date(event.startDate)}
                  endDate={event.endDate ? new Date(event.endDate) : undefined}
                  location={event.location}
                  status={event.status}
                  onClick={() => router.push(`/events/${event.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <h3 className="mb-2 text-lg font-semibold">No upcoming events</h3>
              <p className="mb-4 text-muted-foreground">
                You don't have any upcoming events. Browse events to register.
              </p>
              <Button
                onClick={() => router.push("/events")}
                className="bg-[#00b0a6] text-white hover:bg-[#00b0a6]/90"
              >
                Browse Events
              </Button>
            </div>
          )}

          {upcomingEventsCount > 3 && !viewAll && (
            <div className="mt-4 text-center">
              <Button
                variant="outline"
                onClick={() => setViewAll(true)}
              >
                Show More
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Surveys & Notifications Section */}
      <div className="grid gap-8 md:grid-cols-2">
        {/* Pending Surveys */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Pending Surveys</CardTitle>
            <Button
              variant="ghost"
              onClick={() => router.push("/attendee/surveys")}
            >
              View All
            </Button>
          </CardHeader>
          <CardContent>
            {pendingSurveys.length > 0 ? (
              <div className="space-y-4">
                {pendingSurveys.slice(0, 3).map((survey) => (
                  <SurveyCard
                    key={survey.id}
                    id={survey.id}
                    eventName={survey.eventName}
                    eventDate={new Date(survey.eventDate)}
                    completed={survey.completed}
                    dueDate={survey.dueDate ? new Date(survey.dueDate) : undefined}
                    onClick={() => router.push(`/attendee/surveys/${survey.id}`)}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-6 text-center">
                <p className="text-muted-foreground">
                  No pending surveys at the moment.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            {notifications.length > 0 ? (
              <div className="space-y-4">
                {notifications.slice(0, 3).map((notification) => (
                  <NotificationCard
                    key={notification.id}
                    id={notification.id}
                    type={notification.type as "event" | "survey" | "reminder" | "info"}
                    title={notification.title}
                    message={notification.message}
                    date={new Date(notification.createdAt)}
                    read={notification.read}
                    actionLabel={notification.actionLabel}
                    onAction={() => {
                      if (notification.actionUrl) {
                        router.push(notification.actionUrl);
                      }
                    }}
                    onMarkAsRead={() => {
                      // Mark notification as read
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-6 text-center">
                <p className="text-muted-foreground">
                  No new notifications.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
