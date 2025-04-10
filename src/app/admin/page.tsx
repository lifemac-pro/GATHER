// app/admin/page.tsx
import { Card, CardContent } from "@/components/ui/card";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-[#E1A913]">
        Welcome, Admin! 🎉
      </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Events */}
          <Card className="shadow-md">
            <CardContent className="p-6 flex flex-col items-center">
              <p className="text-[#00b0a6] font-semibold text-lg">Total Events</p>
              <p className="text-2xl font-bold mt-2">12</p>
            </CardContent>
          </Card>

          {/* Total Attendees */}
          <Card className="shadow-md">
            <CardContent className="p-6 flex flex-col items-center">
              <p className="text-[#00b0a6] font-semibold text-lg">Total Attendees</p>
              <p className="text-2xl font-bold mt-2">340</p>
            </CardContent>
          </Card>

          {/* Surveys Completed */}
          <Card className="shadow-md">
            <CardContent className="p-6 flex flex-col items-center">
              <p className="text-[#00b0a6] font-semibold text-lg">Surveys Completed</p>
              <p className="text-2xl font-bold mt-2">75%</p>
            </CardContent>
          </Card>

          {/* Next Event Countdown */}
          <Card className="shadow-md">
            <CardContent className="p-6 flex flex-col items-center">
              <p className="text-[#00b0a6] font-semibold text-lg">Next Event</p>
              <p className="text-2xl font-bold mt-2">02d 05h 30m</p>
            </CardContent>
          </Card>
        </div>
    </div>
  );
}
