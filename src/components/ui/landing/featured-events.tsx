import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar } from "lucide-react";
import { api } from "@/trpc/server";
import { format } from "date-fns";
import { Key, ReactElement, JSXElementConstructor, ReactNode, ReactPortal, AwaitedReactNode } from "react";

export async function FeaturedEvents() {
  try {
    // Use a simple array of placeholder events instead of fetching from API
    // This avoids the TRPC error while you set up Clerk authentication
    const events = [
      {
        id: '1',
        name: 'Tech Conference 2023',
        startDate: new Date('2023-12-15T09:00:00'),
        location: 'San Francisco, CA',
        description: 'Join us for the biggest tech event of the year with industry leaders and innovators.',
      },
      {
        id: '2',
        name: 'Design Workshop',
        startDate: new Date('2023-12-20T10:00:00'),
        location: 'New York, NY',
        description: 'Learn the latest design trends and techniques from expert designers.',
      },
      {
        id: '3',
        name: 'Startup Networking',
        startDate: new Date('2023-12-25T18:00:00'),
        location: 'Austin, TX',
        description: 'Connect with founders, investors, and entrepreneurs in this exclusive networking event.',
      },
    ];

    return (
      <section className="bg-[#072446] px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center text-3xl font-bold text-[#E1A913] md:text-4xl">
            Upcoming Events
          </h2>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <Card
                key={event.id}
                className="bg-[#072446] border-[#00b0a6]/20 transition-all duration-200 hover:border-[#00b0a6]/40"
              >
                <CardHeader>
                  <h3 className="text-xl font-bold text-[#E1A913]">{event.name}</h3>
                </CardHeader>
                <CardContent className="space-y-2 text-[#B0B8C5]">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-[#00b0a6]" />
                    <span>
                      {format(event.startDate, "MMM d, yyyy 'at' h:mm a")}
                    </span>
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-[#00b0a6]" />
                      <span>{event.location}</span>
                    </div>
                  )}
                  <p className="mt-4">{event.description}</p>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full bg-[#00b0a6] text-white hover:bg-[#00b0a6]/90"
                    size="lg"
                  >
                    Learn More
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  } catch (error) {
    console.error("Error fetching events:", error);
    return (
      <section className="bg-[#072446] px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center text-3xl font-bold text-[#E1A913] md:text-4xl">
            Events
          </h2>
          <p className="text-center text-white">Unable to load events at this time.</p>
        </div>
      </section>
    );
  }
}
