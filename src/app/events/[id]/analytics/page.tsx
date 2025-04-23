"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { AdvancedAnalytics } from "@/components/analytics/advanced-analytics";
import { DemographicsAnalytics } from "@/components/analytics/demographics-analytics";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import {
  Calendar,
  ChevronDown,
  Download,
  RefreshCw,
  TrendingUp,
  Users,
  UserCheck,
  Clock,
  Ticket,
  DollarSign,
  MapPin,
} from "lucide-react";
import {
  format,
  subDays,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
} from "date-fns";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Colors for charts
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];
const STATUS_COLORS = {
  registered: "#FFBB28",
  "checked-in": "#00C49F",
  cancelled: "#FF8042",
  waitlisted: "#8884d8",
};

export default function EventAnalyticsPage() {
  const params = useParams();
  const eventId = params.id as string;

  const [dateRange, setDateRange] = useState("all");
  const [refreshKey, setRefreshKey] = useState(0);

  // Get event details
  const { data: event, isLoading: isLoadingEvent } = api.event.getById.useQuery(
    { id: eventId },
    { enabled: !!eventId },
  );

  // Get attendees for this event
  const { data: attendeesData, isLoading: isLoadingAttendees } =
    api.attendee.getByEvent.useQuery({ eventId }, { enabled: !!eventId });

  // Get check-in stats
  const { data: checkInStats } = api.attendee.getCheckInStats.useQuery(
    { eventId },
    { enabled: !!eventId },
  );

  // Get analytics data
  const {
    data: analyticsData,
    isLoading: isLoadingAnalytics,
    refetch: refetchAnalytics,
  } = api.analytics.getEventAnalytics.useQuery(
    {
      eventId,
      startDate:
        dateRange === "30days"
          ? subDays(new Date(), 30)
          : dateRange === "thisMonth"
            ? startOfMonth(new Date())
            : undefined,
      endDate: dateRange === "thisMonth" ? endOfMonth(new Date()) : undefined,
    },
    { enabled: !!eventId },
  );

  // Calculate date range for display
  const getDateRangeText = () => {
    switch (dateRange) {
      case "30days":
        return `Last 30 days (${format(subDays(new Date(), 30), "MMM d")} - ${format(new Date(), "MMM d")})`;
      case "thisMonth":
        return `This month (${format(startOfMonth(new Date()), "MMM d")} - ${format(endOfMonth(new Date()), "MMM d")})`;
      default:
        return "All time";
    }
  };

  // Prepare data for registration trend chart
  const prepareRegistrationTrendData = () => {
    if (!attendeesData || attendeesData.length === 0) return [];

    // Sort attendees by registration date
    const sortedAttendees = [...attendeesData].sort(
      (a, b) =>
        new Date(a.registeredAt).getTime() - new Date(b.registeredAt).getTime(),
    );

    // Get date range
    const firstDate = new Date(sortedAttendees[0].registeredAt);
    const lastDate = new Date();

    // Create daily data points
    const days = eachDayOfInterval({ start: firstDate, end: lastDate });

    // Initialize data with cumulative counts
    const data = days.map((day) => {
      const dateStr = format(day, "yyyy-MM-dd");
      return {
        date: dateStr,
        displayDate: format(day, "MMM d"),
        count: 0,
        cumulative: 0,
      };
    });

    // Count registrations per day
    sortedAttendees.forEach((attendee) => {
      const regDate = format(new Date(attendee.registeredAt), "yyyy-MM-dd");
      const index = data.findIndex((d) => d.date === regDate);
      if (index !== -1) {
        data[index].count += 1;
      }
    });

    // Calculate cumulative counts
    let cumulative = 0;
    data.forEach((day, i) => {
      cumulative += day.count;
      data[i].cumulative = cumulative;
    });

    return data;
  };

  // Prepare data for status pie chart
  const prepareStatusData = () => {
    if (!attendeesData || attendeesData.length === 0) return [];

    const statusCounts = {
      registered: 0,
      "checked-in": 0,
      cancelled: 0,
      waitlisted: 0,
    };

    attendeesData.forEach((attendee) => {
      if (
        statusCounts[attendee.status as keyof typeof statusCounts] !== undefined
      ) {
        statusCounts[attendee.status as keyof typeof statusCounts] += 1;
      } else {
        statusCounts.registered += 1; // Default to registered if status is unknown
      }
    });

    return Object.entries(statusCounts)
      .map(([name, value]) => ({
        name,
        value,
        color: STATUS_COLORS[name as keyof typeof STATUS_COLORS],
      }))
      .filter((item) => item.value > 0);
  };

  // Handle refresh
  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
    refetchAnalytics();
  };

  // Handle export data
  const handleExportData = () => {
    if (!attendeesData) return;

    // Create CSV content
    const headers = [
      "Name",
      "Email",
      "Status",
      "Registered At",
      "Checked In At",
    ];
    const rows = attendeesData.map((attendee) => [
      attendee.name,
      attendee.email,
      attendee.status,
      attendee.registeredAt
        ? format(new Date(attendee.registeredAt), "yyyy-MM-dd HH:mm:ss")
        : "",
      attendee.checkedInAt
        ? format(new Date(attendee.checkedInAt), "yyyy-MM-dd HH:mm:ss")
        : "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${event?.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_attendees.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoadingEvent) {
    return (
      <div className="container mx-auto flex justify-center py-8">
        <LoadingSpinner size="lg" text="Loading event details..." />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Event Not Found</CardTitle>
            <CardDescription>
              The event you are looking for could not be found.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const registrationTrendData = prepareRegistrationTrendData();
  const statusData = prepareStatusData();

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold">{event.name}</h1>
            <p className="text-muted-foreground">
              {format(new Date(event.startDate), "PPP")} at{" "}
              {format(new Date(event.startDate), "p")}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href={`/events/${eventId}`}>
              <Button variant="outline">Back to Event</Button>
            </Link>
            <Button variant="outline" onClick={handleExportData}>
              <Download className="mr-2 h-4 w-4" />
              Export Data
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Registrations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Users className="mr-2 h-8 w-8 text-primary" />
              <span className="text-3xl font-bold">
                {attendeesData?.length || 0}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Check-in Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <UserCheck className="mr-2 h-8 w-8 text-green-500" />
              <span className="text-3xl font-bold">
                {checkInStats?.checkedInAttendees || 0}
              </span>
              <span className="ml-2 text-muted-foreground">
                ({checkInStats?.checkedInPercentage || 0}%)
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Capacity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Ticket className="mr-2 h-8 w-8 text-blue-500" />
              <span className="text-3xl font-bold">
                {attendeesData?.length || 0}
              </span>
              <span className="ml-2 text-muted-foreground">
                / {event.maxAttendees?.[0] || "∞"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <DollarSign className="mr-2 h-8 w-8 text-emerald-500" />
              <span className="text-3xl font-bold">
                $
                {((attendeesData?.length || 0) * (event.price || 0)).toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Date Range Selector */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Calendar className="mr-2 h-5 w-5 text-muted-foreground" />
          <span className="font-medium">{getDateRangeText()}</span>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Date Range <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setDateRange("all")}>
                All time
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDateRange("30days")}>
                Last 30 days
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDateRange("thisMonth")}>
                This month
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Advanced Analytics */}
      <Tabs defaultValue="basic">
        <TabsList className="mb-4">
          <TabsTrigger value="basic">Basic Analytics</TabsTrigger>
          <TabsTrigger value="advanced">Advanced Analytics</TabsTrigger>
          <TabsTrigger value="demographics">Demographics</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          {/* Charts */}
          <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Registration Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Registration Trend</CardTitle>
                <CardDescription>
                  Cumulative registrations over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingAttendees ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner size="lg" text="Loading data..." />
                  </div>
                ) : registrationTrendData.length > 0 ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={registrationTrendData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="displayDate"
                          tick={{ fontSize: 12 }}
                          interval={Math.ceil(
                            registrationTrendData.length / 10,
                          )}
                        />
                        <YAxis />
                        <Tooltip
                          formatter={(value, name) => [
                            value,
                            name === "cumulative"
                              ? "Total Registrations"
                              : "Daily Registrations",
                          ]}
                          labelFormatter={(label) => `Date: ${label}`}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="cumulative"
                          name="Total Registrations"
                          stroke="#0088FE"
                          strokeWidth={2}
                          activeDot={{ r: 8 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="count"
                          name="Daily Registrations"
                          stroke="#00C49F"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    <p>No registration data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Attendee Status */}
            <Card>
              <CardHeader>
                <CardTitle>Attendee Status</CardTitle>
                <CardDescription>
                  Breakdown of attendee registration status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingAttendees ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner size="lg" text="Loading data..." />
                  </div>
                ) : statusData.length > 0 ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) =>
                            `${name}: ${(percent * 100).toFixed(0)}%`
                          }
                        >
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value, name) => [
                            value,
                            name.charAt(0).toUpperCase() + name.slice(1),
                          ]}
                        />
                        <Legend
                          formatter={(value) =>
                            value.charAt(0).toUpperCase() + value.slice(1)
                          }
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    <p>No status data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Event Details */}
          <Card>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Date & Time
                    </h3>
                    <p className="mt-1 flex items-center">
                      <Calendar className="mr-2 h-4 w-4 text-primary" />
                      {format(new Date(event.startDate), "PPP")} at{" "}
                      {format(new Date(event.startDate), "p")} -{" "}
                      {format(new Date(event.endDate), "p")}
                    </p>
                  </div>

                  {event.location && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Location
                      </h3>
                      <p className="mt-1 flex items-center">
                        <MapPin className="mr-2 h-4 w-4 text-primary" />
                        {event.location}
                      </p>
                    </div>
                  )}

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Price
                    </h3>
                    <p className="mt-1 flex items-center">
                      <DollarSign className="mr-2 h-4 w-4 text-primary" />
                      {event.price ? `$${event.price.toFixed(2)}` : "Free"}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Category
                    </h3>
                    <p className="mt-1">{event.category || "General"}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Status
                    </h3>
                    <p className="mt-1">{event.status || "Active"}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Created
                    </h3>
                    <p className="mt-1">
                      {event.createdAt
                        ? format(new Date(event.createdAt), "PPP")
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced">
          <AdvancedAnalytics eventId={eventId} />
        </TabsContent>

        <TabsContent value="demographics">
          <DemographicsAnalytics eventId={eventId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
