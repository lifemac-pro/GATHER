"use client"; // Ensure this is a Client Component

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type EventProps = {
  title: string;
  date: string;
  status: "Registered" | "Not Registered";
  image: string;
};

const EventCard: React.FC<EventProps> = ({ title, date, status, image }) => {
  return (
    <Card className="border bg-[#072446] border-gray-200 shadow-md hover:shadow-lg transition p-4 rounded-lg overflow-hidden">
      {/* Event Image */}
      <img src={image} alt={title} className="w-full h-40 object-cover rounded-t-lg" />

      <CardHeader className="pt-3">
        <CardTitle className="text-[#E1A913] text-lg">{title}</CardTitle>
      </CardHeader>

      <CardContent>
        <p className="text-[#00b0a6]">📅 {date}</p>
        <p className={`text-sm font-medium ${status === "Registered" ? "text-green-400" : "text-red-400"}`}>
          {status}
        </p>

        {/* Register Button (Only if Not Registered) */}
        {status === "Not Registered" && (
          <button className="mt-3 w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
            Register
          </button>
        )}
      </CardContent>
    </Card>
  );
};

export default EventCard;
