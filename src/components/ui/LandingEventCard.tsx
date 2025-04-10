"use client"; // Ensure this is a Client Component

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@clerk/nextjs";
import { AuthButton } from "./auth-button";

type EventProps = {
  title: string;
  date: string;
  status: "Registered" | "Not Registered";
  image: string;
};

const LandingEventCard: React.FC<EventProps> = ({ title, date, status, image }) => {
  return (
    <Card className="overflow-hidden rounded-lg border border-gray-200 bg-[#072446] p-4 shadow-md transition hover:shadow-lg">
      {/* Event Image */}
      <img
        src={image}
        alt={title}
        className="h-40 w-full rounded-t-lg object-cover"
      />

      <CardHeader className="pt-3">
        <CardTitle className="text-lg text-[#E1A913]">{title}</CardTitle>
      </CardHeader>

      <CardContent>
        <p className="text-[#00b0a6]">📅 {date}</p>
        <p
          className={`text-sm font-medium ${status === "Registered" ? "text-green-400" : "text-red-400"}`}
        >
          {status}
        </p>

        {/* Register Button with Clerk Authentication (Only if Not Registered) */}
        {status === "Not Registered" && (
          <div className="mt-3 w-full">
            <AuthButton
              mode="sign-in"
              redirectUrl="/attendee/dashboard"
              className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
            >
              Register
            </AuthButton>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LandingEventCard;
