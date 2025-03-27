import { Card } from "@/components/ui/card";
import { BarChart3, Users, ClipboardList, Timer } from "lucide-react";

const stats = [
  { title: "Total Events", value: "12", icon: <BarChart3 size={20} />, color: "bg-blue-500" },
{ title: "Total Attendees", value: "230", icon: <Users size={20} />, color: "bg-black" },
{ title: "Surveys Completed", value: "98%", icon: <ClipboardList size={20} />, color: "bg-black" },
{ title: "Next Event In", value: "2d 5h", icon: <Timer size={20} />, color: "bg-black" },

];

export default function DashboardCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
      {stats.map((stat, index) => (
        <Card key={index} title={stat.title} value={stat.value} icon={stat.icon} color={stat.color} />
      ))}
    </div>
  );
}
