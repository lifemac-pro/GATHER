"use client"; // Ensure this is a Client Component

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// These imports are not used
// import { useAuth } from "@clerk/nextjs";
// import { AuthButton } from "./auth-button";

type EventProps = {
  id?: string;
  title: string;
  date: string;
  status: "Registered" | "Not Registered";
  image: string;
  onRegister?: (eventId: string) => void;
  isLoading?: boolean;
};

const EventCard: React.FC<EventProps> = ({
  id,
  title,
  date,
  status,
  image,
  onRegister,
  isLoading,
}) => {
  return (
    <Card className="overflow-hidden rounded-lg border border-gray-200 bg-[#072446] p-4 shadow-md transition hover:shadow-lg">
      {/* Event Image */}
      <img
        src={image || "/images/tech-conference.jpg"}
        alt={title}
        className="h-40 w-full rounded-t-lg object-cover"
        onError={(e) => {
          e.currentTarget.src = "/images/tech-conference.jpg";
        }}
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
            <button
              className={`w-full rounded-lg px-4 py-2 text-white transition ${isLoading ? "cursor-not-allowed bg-gray-500" : "bg-blue-600 hover:bg-blue-700"}`}
              onClick={() => id && onRegister && onRegister(id)}
              disabled={isLoading ?? !id ?? !onRegister}
            >
              {isLoading ? "Registering..." : "Register"}
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EventCard;
