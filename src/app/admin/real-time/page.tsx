"use client";

import { RealTimeDashboard } from "@/components/admin/real-time-dashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function AdminRealTimePage() {
  const router = useRouter();
  
  return (
    <div className="container py-8">
      <div className="mb-6 flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => router.push("/admin/dashboard")}
          className="flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
        <h1 className="text-3xl font-bold">Real-Time Monitoring</h1>
      </div>
      
      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:w-auto md:grid-cols-3">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="attendees">Attendees</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Real-Time Dashboard</CardTitle>
              <CardDescription>
                Monitor events, attendees, and survey responses in real-time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RealTimeDashboard />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="events" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Event Monitoring</CardTitle>
              <CardDescription>
                Track event registrations, check-ins, and attendance in real-time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                This feature will be available soon. For now, you can view event statistics in the Dashboard tab.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="attendees" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Attendee Monitoring</CardTitle>
              <CardDescription>
                Track attendee activity and engagement in real-time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                This feature will be available soon. For now, you can view attendee statistics in the Dashboard tab.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
