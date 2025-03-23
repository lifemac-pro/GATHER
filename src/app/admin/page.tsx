// Import necessary components
import Sidebar from "../../components/ui/sidebar"; 
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Calendar, Users, ClipboardList, Timer } from "lucide-react";

const stats = [
  { title: "Total Events", value: "12", icon: <Calendar size={28} />, color: "bg-blue-500" },
  { title: "Total Attendees", value: "230", icon: <Users size={28} />, color: "bg-green-500" },
  { title: "Surveys Completed", value: "98", icon: <ClipboardList size={28} />, color: "bg-yellow-500" },
  { title: "Next Event In", value: "2d 5h", icon: <Timer size={28} />, color: "bg-purple-500" },
];

export default function AdminDashboard() {
  return (
    <div className="flex flex-col md:flex-row min-h-screen w-full overflow-x-hidden">
      {/* Sidebar - Now works on both mobile and desktop */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-grow p-4 sm:p-6 bg-[#F8FAFC] w-full">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#072446] text-center sm:text-left">
          Welcome, Admin!
        </h1>

        {/* Dashboard Stats - Improved for Mobile View */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-6">
          {stats.map((stat, index) => (
            <Card key={index} className="shadow-lg w-full min-h-[140px] flex flex-col justify-between bg-[#072446] text-white p-4 rounded-lg">
              <CardHeader className="flex items-center space-x-4">
                <div className={`p-3 rounded-full text-white ${stat.color} flex items-center justify-center`}>
                  {stat.icon}
                </div>
                <CardTitle className="text-white text-sm sm:text-lg">{stat.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl sm:text-2xl font-bold">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
