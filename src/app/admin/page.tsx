// app/admin/page.tsx
import { Card, CardContent } from "@/components/ui/card";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-[#E1A913]">Welcome, Admin! 🎉</h1>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Events */}
        <Card className="shadow-md">
          <CardContent className="flex flex-col items-center p-6">
            <p className="text-lg font-semibold text-[#00b0a6]">Total Events</p>
            <p className="mt-2 text-2xl font-bold">12</p>
          </CardContent>
        </Card>

        {/* Total Attendees */}
        <Card className="shadow-md">
          <CardContent className="flex flex-col items-center p-6">
            <p className="text-lg font-semibold text-[#00b0a6]">
              Total Attendees
            </p>
            <p className="mt-2 text-2xl font-bold">340</p>
          </CardContent>
        </Card>

        {/* Surveys Completed */}
        <Card className="shadow-md">
          <CardContent className="flex flex-col items-center p-6">
            <p className="text-lg font-semibold text-[#00b0a6]">
              Surveys Completed
            </p>
            <p className="mt-2 text-2xl font-bold">75%</p>
          </CardContent>
        </Card>

        {/* Next Event Countdown */}
        <Card className="shadow-md">
          <CardContent className="flex flex-col items-center p-6">
            <p className="text-lg font-semibold text-[#00b0a6]">Next Event</p>
            <p className="mt-2 text-2xl font-bold">02d 05h 30m</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
