import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { EventImage } from "@/components/events/event-image";

export function FeaturedEvents() {
  // Use our sample events from the mock storage
  const events = [
    {
      id: 'sample-event-1',
      name: 'Sample Conference 2023',
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000),
      location: 'Virtual Event',
      description: 'This is a sample conference for testing purposes. Join us for a day of learning and networking!',
      category: 'Conference',
      price: 99.99,
      image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop',
    },
    {
      id: 'sample-event-2',
      name: 'Tech Workshop',
      startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
      location: 'Tech Hub, 123 Main St',
      description: 'Hands-on workshop on the latest technologies. Bring your laptop!',
      category: 'Workshop',
      price: 49.99,
      image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop',
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
              className="overflow-hidden bg-[#072446] border-[#00b0a6]/20 transition-all duration-200 hover:border-[#00b0a6]/40"
            >
              <EventImage src={event.image} alt={event.name} />
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
                <p className="mt-4 line-clamp-2">{event.description}</p>
              </CardContent>
              <CardFooter>
                <Link href={`/events/${event.id}`} className="w-full">
                  <Button
                    className="w-full bg-[#00b0a6] text-white hover:bg-[#00b0a6]/90"
                    size="lg"
                  >
                    View Details
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link href="/events">
            <Button
              className="bg-[#E1A913] text-[#072446] hover:bg-[#E1A913]/90"
              size="lg"
            >
              View All Events
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
