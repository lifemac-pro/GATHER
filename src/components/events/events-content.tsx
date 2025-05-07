"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { EventList } from "@/components/events/event-list";
import { EventSearch } from "@/components/events/event-search";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { AttendeeSidebar } from "@/components/ui/attendee/sidebar";

export function EventsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  // Get initial values from URL
  const initialTab = searchParams.get("tab") || "all";
  const initialCategory = searchParams.get("category") || "";

  const [activeTab, setActiveTab] = useState<"all" | "upcoming" | "featured">(
    (initialTab as any) || "all",
  );
  const [refreshKey, setRefreshKey] = useState(0);

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value as "all" | "upcoming" | "featured");
    const params = new URLSearchParams(searchParams);
    params.set("tab", value);
    router.push(`/events?${params.toString()}`);
  };

  return (
    <>
      <AttendeeSidebar />
      <div className="container mx-auto py-8 md:ml-64">
        <div className="mb-8 flex flex-col items-start justify-between md:flex-row md:items-center">
          <h1 className="mb-4 text-3xl font-bold md:mb-0">Events</h1>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                console.log("Refreshing events page");
                setRefreshKey((prev) => prev + 1);
                router.refresh();
                toast({
                  title: "Refreshing events",
                  description: "Fetching the latest events from the database...",
                });
              }}
            >
              Refresh Events
            </Button>

            {user && (
              <Button onClick={() => router.push("/events/create")}>
                Create Event
              </Button>
            )}
          </div>
        </div>

        <div className="mb-8 rounded-lg bg-white p-6 shadow">
          <EventSearch />
        </div>

        <Tabs
          defaultValue={activeTab}
          onValueChange={handleTabChange}
          className="mb-8"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All Events</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="featured">Featured</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <EventList refreshKey={refreshKey} />
          </TabsContent>

          <TabsContent value="upcoming">
            <EventList upcoming={true} refreshKey={refreshKey} />
          </TabsContent>

          <TabsContent value="featured">
            <EventList featured={true} refreshKey={refreshKey} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}