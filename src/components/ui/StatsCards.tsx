import { Card, CardContent } from "@/components/ui/card";

export function StatsCards() {
  const stats = [
    { title: "Total Events", value: 12 },
    { title: "Total Attendees", value: 245 },
    { title: "Surveys Completed", value: "87%" },
    { title: "Next Event Countdown", value: "5 days" },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="shadow-md">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-[#00b0a6]">{stat.title}</h2>
            <p className="mt-2 text-2xl text-[#E1A913]">{stat.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
