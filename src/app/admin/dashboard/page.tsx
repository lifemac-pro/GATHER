"use client";

import { StatsCard } from "@/components/analytics/stats-card";
import { AttendanceChart } from "@/components/analytics/attendance-chart";
import { DemographicsChart } from "@/components/analytics/demographics-chart";
import { api } from "@/trpc/react";
import {
  Users,
  CalendarDays,
  TrendingUp,
  Percent,
} from "lucide-react";

export default function AdminDashboardPage() {
  const { data: stats } = api.analytics.getStats.useQuery();
  const { data: attendanceData } = api.analytics.getAttendanceData.useQuery();
  const { data: demographicsData } = api.analytics.getDemographicsData.useQuery();

  return (
    <div className="container space-y-8 py-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Attendees"
          value={stats?.totalAttendees ?? 0}
          icon={<Users className="h-4 w-4" />}
          trend={{ value: 12, positive: true }}
        />
        <StatsCard
          title="Upcoming Events"
          value={stats?.upcomingEvents ?? 0}
          icon={<CalendarDays className="h-4 w-4" />}
        />
        <StatsCard
          title="Registration Rate"
          value={`${stats?.registrationRate ?? 0}%`}
          icon={<TrendingUp className="h-4 w-4" />}
          trend={{ value: 8, positive: true }}
        />
        <StatsCard
          title="Attendance Rate"
          value={`${stats?.attendanceRate ?? 0}%`}
          icon={<Percent className="h-4 w-4" />}
          trend={{ value: 5, positive: true }}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-7">
        <AttendanceChart data={attendanceData ?? []} />
        <DemographicsChart data={demographicsData ?? []} />
      </div>
    </div>
  );
}
