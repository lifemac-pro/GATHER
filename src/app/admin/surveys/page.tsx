"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
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

// Define types for the survey data
interface SurveyResponse {
  id: string;
  event: {
    id: string;
    name: string;
  };
  user: {
    id: string;
    name: string;
  };
  rating: number;
  feedback: string;
  submittedAt: string;
}

interface EventStats {
  eventId: string | null;
  eventName: string;
  avgRating: number;
  responseCount: number;
}

interface SurveyStats {
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
    total: number;
  };
  ratingDistribution: Record<string, number>;
  monthlyTrends: Array<{
    month: string;
    avgRating: number;
    count: number;
  }>;
  topEvents: EventStats[];
}

export default function SurveysPage() {
  const router = useRouter();
  const [selectedEventId, setSelectedEventId] = useState<string>("all");

  // Only pass eventId to the query if it's not "all"
  const { data: surveys } = api.survey.getAll.useQuery({
    eventId: selectedEventId !== "all" ? selectedEventId : undefined,
  }) as { data: SurveyResponse[] | undefined };

  const { data: stats } = api.survey.getStats.useQuery() as { data: SurveyStats | undefined };

  if (!stats) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-lg font-medium">Loading survey data...</p>
        </div>
      </div>
    );
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
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[#072446]">Survey Feedback</h1>
        <Button
          onClick={() => router.push("/admin/surveys/create")}
          className="bg-[#072446] hover:bg-[#051a33]"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Survey
        </Button>
      </div>

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
              {stats.topEvents.map((event, index) => (
                <div
                  key={event.eventId ?? `event-${index}`}
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
                <SelectItem key="all-events" value="all">
                  All Events
                </SelectItem>
                {stats.topEvents.map((event, index) => (
                  event.eventId ? (
                    <SelectItem key={event.eventId} value={event.eventId}>
                      {event.eventName}
                    </SelectItem>
                  ) : null
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
              {!surveys || surveys.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No survey responses found
                  </TableCell>
                </TableRow>
              ) : (
                surveys.map((survey) => (
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
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
