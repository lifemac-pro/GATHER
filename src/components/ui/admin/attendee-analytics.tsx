"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface AttendeeAnalyticsProps {
  dailyTrends: Array<{
    date: string;
    registrations: number;
    checkIns: number;
    cancellations: number;
  }>;
  statusDistribution: Array<{
    status: string;
    count: number;
  }>;
  startDate: Date;
  endDate: Date;
  onDateRangeChange: (start: Date, end: Date) => void;
}

const COLORS = ["#072446", "#E1A913", "#00b0a6", "#B0B8C5"];
const STATUS_COLORS = {
  registered: "#072446",
  attended: "#00b0a6",
  cancelled: "#B0B8C5",
  waitlisted: "#E1A913",
};

export function AttendeeAnalytics({
  dailyTrends,
  statusDistribution,
  startDate,
  endDate,
  onDateRangeChange,
}: AttendeeAnalyticsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Daily Trends */}
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle className="text-[#072446]">Daily Attendance Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="registrations"
                  stroke="#072446"
                  strokeWidth={2}
                  name="Registrations"
                />
                <Line
                  type="monotone"
                  dataKey="checkIns"
                  stroke="#00b0a6"
                  strokeWidth={2}
                  name="Check-ins"
                />
                <Line
                  type="monotone"
                  dataKey="cancellations"
                  stroke="#B0B8C5"
                  strokeWidth={2}
                  name="Cancellations"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-[#072446]">Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDistribution}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => `${entry.status} (${entry.count})`}
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell
                      key={entry.status}
                      fill={STATUS_COLORS[entry.status as keyof typeof STATUS_COLORS] || COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Additional analytics cards can be added here */}
    </div>
  );
}
