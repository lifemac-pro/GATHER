import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"; // Ensure correct import path

// Define prop types
type EventProps = {
  title: string;
  date: string;
  status: "Registered" | "Not Registered";
  actionButton?: React.ReactNode;
};

const EventCard: React.FC<EventProps> = ({ title, date, status }) => {
  return (
    <Card className="border border-gray-200 shadow-md hover:shadow-lg transition">
      <CardHeader>
        <CardTitle className="text-[#E1A913]">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-[#00b0a6]">📅 {date}</p>
        <p className={`text-sm ${status === "Registered" ? "text-green-600" : "text-red-600"}`}>
          {status}
        </p>
      </CardContent>
    </Card>
  );
};

export default EventCard;
