"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  BarChart,
  Bar,
} from "recharts";
import { format } from "date-fns";
import { Star } from "lucide-react";

const COLORS = ["#072446", "#E1A913", "#00b0a6", "#B0B8C5"];

export default function SurveysPage() {
  const [selectedEventId, setSelectedEventId] = useState<string>();
  const { data: surveys } = api.survey.getAll.useQuery({
    eventId: selectedEventId,
  });
  const { data: stats } = api.survey.getStats.useQuery();

  if (!stats) {
    return <div>Loading...</div>;
  }

  // Prepare data for sentiment chart
  const sentimentData = [
    { name: "Positive", value: stats.sentiment.positive },
    { name: "Neutral", value: stats.sentiment.neutral },
    { name: "Negative", value: stats.sentiment.negative },
  ];

  // Prepare data for rating distribution
  const ratingData = Object.entries(stats.ratingDistribution).map(
    ([rating, count]) => ({
      rating: Number(rating),
      count,
    }),
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-[#072446]">Survey Feedback</h1>

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Monthly Trends */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="text-[#072446]">Rating Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[0, 5]} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="avgRating"
                    name="Average Rating"
                    stroke="#E1A913"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name="Response Count"
                    stroke="#00b0a6"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Sentiment Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[#072446]">
              Sentiment Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sentimentData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry) => `${entry.name} (${entry.value})`}
                  >
                    {sentimentData.map((_, index) => (
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
            </div>
          </CardContent>
        </Card>

        {/* Rating Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[#072446]">
              Rating Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ratingData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="rating" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#00b0a6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Rated Events */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[#072446]">Top Rated Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.topEvents.map((event) => (
                <div
                  key={event.eventId}
                  className="flex items-center justify-between border-b pb-2 last:border-0"
                >
                  <div>
                    <p className="font-medium text-[#072446]">
                      {event.eventName}
                    </p>
                    <p className="text-sm text-[#B0B8C5]">
                      {event.responseCount} responses
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-[#E1A913]" fill="#E1A913" />
                    <span className="font-medium">{event.avgRating}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Survey List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-[#072446]">Survey Responses</CardTitle>
            <Select value={selectedEventId} onValueChange={setSelectedEventId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by event" />
              </SelectTrigger>
              <SelectContent>
                {stats.topEvents.map((event) => (
                  <SelectItem key={event.eventId} value={event.eventId}>
                    {event.eventName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Attendee</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Feedback</TableHead>
                <TableHead>Submitted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {surveys?.map((survey: any) => (
                <TableRow key={survey.id}>
                  <TableCell>{survey.event.name}</TableCell>
                  <TableCell>{survey.user.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-[#E1A913]" fill="#E1A913" />
                      <span>{survey.rating}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-md truncate">
                    {survey.feedback}
                  </TableCell>
                  <TableCell>
                    {format(new Date(survey.submittedAt), "MMM d, yyyy")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
