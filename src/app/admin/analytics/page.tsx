"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { api } from "@/trpc/react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Skeleton } from "@/components/ui/skeleton";
import { startOfMonth, subMonths } from "date-fns";

const COLORS = ["#00b0a6", "#E1A913", "#072446", "#B0B8C5"];

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(subMonths(new Date(), 1)),
    to: new Date(),
  });

  // In TRPC v11, we don't need to pass parameters if the procedure doesn't expect them
  const { data: stats, isLoading } = api.analytics.getStats.useQuery();

  if (isLoading) {
    return (
      <div className="space-y-8 p-8">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Analytics Dashboard
        </h1>
        <div className="flex items-center gap-4">
          <DateRangePicker
            from={dateRange.from}
            to={dateRange.to}
            onSelect={(range) => {
              if (range?.from && range?.to) {
                setDateRange({ from: range.from, to: range.to });
              }
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Events</h3>
          <p className="mt-2 text-3xl font-bold">{stats?.totalEvents}</p>
          <p className="mt-1 text-sm text-gray-500">
            {stats?.totalEvents} active events
          </p>
        </Card>
        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Attendees</h3>
          <p className="mt-2 text-3xl font-bold">{stats?.totalAttendees}</p>
          <p className="mt-1 text-sm text-gray-500">
            {stats?.totalAttendees} this month
          </p>
        </Card>
        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-500">Check-in Rate</h3>
          <p className="mt-2 text-3xl font-bold">
            {stats?.checkedInRate.toFixed(1)}%
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {Math.round(
              ((stats?.totalAttendees || 0) * (stats?.checkedInRate || 0)) /
                100,
            )}{" "}
            total check-ins
          </p>
        </Card>
        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-500">Feedback Rate</h3>
          <p className="mt-2 text-3xl font-bold">
            {stats?.checkedInRate.toFixed(1)}%
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {Math.round((stats?.totalAttendees || 0) * 0.5)} responses
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-medium">Event Categories</h3>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={[
                  { name: "Tech", value: 40 },
                  { name: "Business", value: 30 },
                  { name: "Social", value: 20 },
                  { name: "Other", value: 10 },
                ]}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={150}
                label
              >
                {[
                  { name: "Tech", value: 40 },
                  { name: "Business", value: 30 },
                  { name: "Social", value: 20 },
                  { name: "Other", value: 10 },
                ].map((item, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
