//import Sidebar from "../../components/ui/sidebar";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Calendar, Users, ClipboardList, Timer } from "lucide-react";
//import DashboardCards from "@/components/ui/dashboard-cards";

const stats = [
  { title: "Total Events", value: "12", icon: <Calendar size={28} />, color: "bg-blue-500" },
  { title: "Total Attendees", value: "230", icon: <Users size={28} />, color: "bg-green-500" },
  { title: "Surveys Completed", value: "98", icon: <ClipboardList size={28} />, color: "bg-yellow-500" },
  { title: "Next Event In", value: "2d 5h", icon: <Timer size={28} />, color: "bg-purple-500" },
];

export default function AdminDashboard() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar
      <Sidebar /> */}
      {/* <DashboardCards /> */}

      {/* Main Content */}
      <main className="flex-grow p-6 bg-[#F8FAFC]">
        <h1 className="text-3xl font-bold text-[#072446]">Welcome, Admin!</h1>

        {/* Dashboard Stats */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
  {stats.map((stat, index) => (
    <Card key={index} className="shadow-lg w-full min-h-[150px] flex flex-col justify-between">
      <CardHeader className="flex items-center space-x-4">
        <div className={`p-4 rounded-full text-white ${stat.color} flex items-center justify-center`}>
          {stat.icon}
        </div>
        <CardTitle className="text-white[#072446]">{stat.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-white2xl font-bold">{stat.value}</p>
      </CardContent>
    </Card>
  ))}
</div>

      </main>
    </div>
  );
}
