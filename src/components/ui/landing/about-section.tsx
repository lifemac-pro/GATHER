import { CalendarDays, Bell, CheckCircle2, BarChart3 } from "lucide-react";

export function AboutSection() {
  return (
    <section className="bg-white px-4 py-16">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-12 text-center text-3xl font-bold text-[#E1A913] md:text-4xl">
          About GatherEase
        </h2>
        
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="flex flex-col items-center text-center"
            >
              <div className="mb-4 rounded-full bg-[#072446] p-3 text-[#00b0a6]">
                <feature.icon size={24} />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-[#072446]">
                {feature.title}
              </h3>
              <p className="text-[#B0B8C5]">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const features = [
  {
    title: "Effortless Event Creation",
    description: "Organizers can set up events in minutes with our intuitive interface.",
    icon: CalendarDays,
  },
  {
    title: "Smart Notifications",
    description: "Stay updated with automated reminders and event changes.",
    icon: Bell,
  },
  {
    title: "Easy Registration",
    description: "Quick and hassle-free attendee sign-ups for all events.",
    icon: CheckCircle2,
  },
  {
    title: "Post-Event Insights",
    description: "Collect valuable feedback to improve future events.",
    icon: BarChart3,
  },
];
