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

  // Transform data to match the expected types
  const formattedAttendanceData = attendanceData ? attendanceData.map(item => ({
    name: item.status,
    total: item.count,
    attended: item.status === 'attended' ? item.count : 0
  })) : [];

  const formattedDemographicsData = demographicsData ? demographicsData.map(item => ({
    name: item.category,
    value: item.count
  })) : [];

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
          value={stats?.totalEvents ?? 0}
          icon={<CalendarDays className="h-4 w-4" />}
        />
        <StatsCard
          title="Registration Rate"
          value={`${stats?.checkedInRate.toFixed(1) ?? 0}%`}
          icon={<TrendingUp className="h-4 w-4" />}
          trend={{ value: 8, positive: true }}
        />
        <StatsCard
          title="Attendance Rate"
          value={`${stats?.checkedInRate.toFixed(1) ?? 0}%`}
          icon={<Percent className="h-4 w-4" />}
          trend={{ value: 5, positive: true }}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-7">
        <AttendanceChart data={formattedAttendanceData} />
        <DemographicsChart data={formattedDemographicsData} />
      </div>
    </div>
  );
}
