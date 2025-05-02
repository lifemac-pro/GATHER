"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { api } from "@/trpc/react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { format, subDays } from "date-fns";
import { 
  Activity, 
  Users, 
  Calendar, 
  FileText, 
  CheckSquare, 
  RefreshCw,
  Clock
} from "lucide-react";

const COLORS = ["#072446", "#E1A913", "#00b0a6", "#B0B8C5", "#6366f1", "#ec4899"];

export function RealTimeDashboard() {
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [activeTab, setActiveTab] = useState("overview");
  
  // Get dashboard data
  const { data: dashboardData, isLoading: isDashboardLoading, refetch: refetchDashboard } = 
    api.admin.getDashboardData.useQuery(undefined, {
      refetchInterval: refreshInterval * 1000,
    });
  
  // Get recent activity
  const { data: recentActivity, isLoading: isActivityLoading, refetch: refetchActivity } = 
    api.admin.getRecentActivity.useQuery(undefined, {
      refetchInterval: refreshInterval * 1000,
    });
  
  // Get event stats
  const { data: eventStats, isLoading: isEventStatsLoading, refetch: refetchEventStats } = 
    api.admin.getEventStats.useQuery({
      startDate: subDays(new Date(), 30),
      endDate: new Date(),
    }, {
      refetchInterval: refreshInterval * 1000,
    });
  
  // Handle manual refresh
  const handleRefresh = () => {
    refetchDashboard();
    refetchActivity();
    refetchEventStats();
    setLastRefreshed(new Date());
  };
  
  // Update last refreshed time
  useEffect(() => {
    const interval = setInterval(() => {
      setLastRefreshed(new Date());
    }, refreshInterval * 1000);
    
    return () => clearInterval(interval);
  }, [refreshInterval]);
  
  // Format data for charts
  const formatAttendeeStatusData = () => {
    if (!dashboardData?.attendeeStatusCounts) return [];
    
    return Object.entries(dashboardData.attendeeStatusCounts).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
    }));
  };
  
  const formatEventTypeData = () => {
    if (!dashboardData?.eventTypeCounts) return [];
    
    return Object.entries(dashboardData.eventTypeCounts).map(([type, count]) => ({
      name: type === "in-person" ? "In-Person" : "Virtual",
      value: count,
    }));
  };
  
  const formatRegistrationTrendData = () => {
    if (!eventStats?.registrationTrend) return [];
    
    return eventStats.registrationTrend.map(item => ({
      date: format(new Date(item.date), "MMM dd"),
      count: item.count,
    }));
  };
  
  // Loading state
  if (isDashboardLoading || isActivityLoading || isEventStatsLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" text="Loading dashboard data..." />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <h2 className="text-3xl font-bold tracking-tight">Real-Time Dashboard</h2>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Last updated: {format(lastRefreshed, "h:mm:ss a")}
          </Badge>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            className="flex items-center gap-1"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-1">
            <Activity className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            Events
          </TabsTrigger>
          <TabsTrigger value="attendees" className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            Attendees
          </TabsTrigger>
          <TabsTrigger value="surveys" className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            Surveys
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          {/* Overview Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData?.totalEvents || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData?.activeEvents || 0} active events
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Attendees</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData?.totalAttendees || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData?.checkedInAttendees || 0} checked in
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Surveys</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData?.totalSurveys || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData?.activeSurveys || 0} active surveys
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Survey Responses</CardTitle>
                <CheckSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData?.totalSurveyResponses || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData?.responseRate || 0}% response rate
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest actions across the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity && recentActivity.length > 0 ? (
                  recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start gap-4 border-b pb-4 last:border-0 last:pb-0">
                      <div className="rounded-full bg-primary/10 p-2">
                        {activity.type === "registration" && <Users className="h-4 w-4 text-primary" />}
                        {activity.type === "check-in" && <CheckSquare className="h-4 w-4 text-primary" />}
                        {activity.type === "survey" && <FileText className="h-4 w-4 text-primary" />}
                        {activity.type === "event" && <Calendar className="h-4 w-4 text-primary" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.title}</p>
                        <p className="text-xs text-muted-foreground">{activity.description}</p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(activity.timestamp), "MMM d, h:mm a")}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-sm text-muted-foreground">No recent activity</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="events" className="space-y-4">
          {/* Event Stats */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Event Types</CardTitle>
                <CardDescription>Distribution of in-person vs virtual events</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={formatEventTypeData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {formatEventTypeData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Registration Trend</CardTitle>
                <CardDescription>New registrations over the last 30 days</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={formatRegistrationTrendData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#00b0a6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          
          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
              <CardDescription>Events happening in the next 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData?.upcomingEvents && dashboardData.upcomingEvents.length > 0 ? (
                  dashboardData.upcomingEvents.map((event, index) => (
                    <div key={index} className="flex items-start justify-between gap-4 border-b pb-4 last:border-0 last:pb-0">
                      <div>
                        <p className="font-medium">{event.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(event.startDate), "MMM d, yyyy")} • {event.location || "Online"}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge>{event.registrationCount} registered</Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-sm text-muted-foreground">No upcoming events</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="attendees" className="space-y-4">
          {/* Attendee Stats */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Attendee Status</CardTitle>
                <CardDescription>Distribution of attendee statuses</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={formatAttendeeStatusData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {formatAttendeeStatusData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Recent Registrations</CardTitle>
                <CardDescription>Latest attendee registrations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData?.recentRegistrations && dashboardData.recentRegistrations.length > 0 ? (
                    dashboardData.recentRegistrations.map((registration, index) => (
                      <div key={index} className="flex items-start justify-between gap-4 border-b pb-4 last:border-0 last:pb-0">
                        <div>
                          <p className="font-medium">{registration.attendeeName}</p>
                          <p className="text-sm text-muted-foreground">{registration.eventName}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant={registration.status === "confirmed" ? "default" : "outline"}>
                            {registration.status}
                          </Badge>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {format(new Date(registration.registeredAt), "MMM d, h:mm a")}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-sm text-muted-foreground">No recent registrations</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="surveys" className="space-y-4">
          {/* Survey Stats */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Survey Response Rate</CardTitle>
                <CardDescription>Response rates for active surveys</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData?.surveyResponseRates && dashboardData.surveyResponseRates.length > 0 ? (
                    dashboardData.surveyResponseRates.map((survey, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{survey.surveyTitle}</p>
                          <p className="text-sm font-medium">{survey.responseRate}%</p>
                        </div>
                        <div className="h-2 w-full rounded-full bg-secondary">
                          <div 
                            className="h-2 rounded-full bg-primary" 
                            style={{ width: `${survey.responseRate}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {survey.responseCount} responses out of {survey.attendeeCount} attendees
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-sm text-muted-foreground">No active surveys</p>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Recent Survey Responses</CardTitle>
                <CardDescription>Latest survey submissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData?.recentSurveyResponses && dashboardData.recentSurveyResponses.length > 0 ? (
                    dashboardData.recentSurveyResponses.map((response, index) => (
                      <div key={index} className="flex items-start justify-between gap-4 border-b pb-4 last:border-0 last:pb-0">
                        <div>
                          <p className="font-medium">{response.attendeeName}</p>
                          <p className="text-sm text-muted-foreground">{response.surveyTitle}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(response.submittedAt), "MMM d, h:mm a")}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-sm text-muted-foreground">No recent survey responses</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
