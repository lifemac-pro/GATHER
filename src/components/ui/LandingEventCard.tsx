"use client"; // Ensure this is a Client Component

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// This import is not used
// import { useAuth } from "@clerk/nextjs";
import { AuthButton } from "./auth-button";

type EventProps = {
  title: string;
  date: string;
  status: "Registered" | "Not Registered";
  image: string;
};

const LandingEventCard: React.FC<EventProps> = ({
  title,
  date,
  status,
  image,
}) => {
  return (
    <Card className="group overflow-hidden rounded-lg border-none bg-white p-0 shadow-lg transition-all duration-300 hover:shadow-xl">
      {/* Event Image with Overlay */}
      <div className="relative overflow-hidden">
        <img
          src={image}
          alt={title}
          className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#082865]/80 to-transparent opacity-70"></div>

        {/* Status Badge */}
        <div className="absolute right-3 top-3">
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wider ${status === "Registered" ? "bg-green-500 text-white" : "bg-[#0055FF] text-white"}`}
          >
            {status}
          </span>
        </div>
      </div>

      <CardHeader className="pb-0 pt-4">
        <CardTitle className="text-xl font-bold text-[#082865]">
          {title}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <p className="mb-4 flex items-center text-gray-600">
          <span className="mr-2">📅</span> {date}
        </p>

        {/* Register Button with Clerk Authentication (Only if Not Registered) */}
        {status === "Not Registered" && (
          <div className="mt-3 w-full">
            <AuthButton
              mode="sign-in"
              redirectUrl="/attendee/dashboard"
              className="w-full rounded-lg bg-[#0055FF] px-4 py-2 text-white shadow-md transition-all hover:bg-[#004BD9] hover:shadow-lg"
            >
              Register Now
            </AuthButton>
          </div>
        )}

        {status === "Registered" && (
          <div className="mt-3 w-full">
            <button
              disabled
              className="w-full cursor-default rounded-lg bg-gray-100 px-4 py-2 text-[#082865] shadow-sm"
            >
              Already Registered
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LandingEventCard;
