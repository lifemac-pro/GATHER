"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AttendeeAnalyticsProps {
  startDate: Date;
  endDate: Date;
  onDateRangeChange: (start: Date, end: Date) => void;
}

export function AttendeeAnalytics({
  startDate,
  endDate,
  onDateRangeChange,
}: AttendeeAnalyticsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Additional analytics cards can be added here */}
    </div>
  );
}
