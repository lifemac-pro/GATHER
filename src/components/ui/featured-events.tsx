import { Card, CardContent } from "./card";
import { Button } from "./button";
import Image from "next/image";

const events = [
  {
    id: 1,
    name: "Tech Conference 2024",
    date: "April 10, 2024",
    image: "/event1.jpg", // Replace with actual images
  },
  {
    id: 2,
    name: "Startup Pitch Night",
    date: "May 5, 2024",
    image: "/event2.jpg",
  },
  {
    id: 3,
    name: "Networking Night",
    date: "June 12, 2024",
    image: "/event3.jpg",
  },
];

export default function FeaturedEvents() {
  return (
    <section className="py-20 px-6 text-center bg-[#0A2A4A] text-white">
      <h2 className="text-3xl font-bold text-[#E1A913]">Featured Events</h2>
      <p className="text-lg text-[#B0B8C5] mt-2">
        Check out our latest events and register now!
      </p>

      {/* Event Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        {events.map((event) => (
          <Card
            key={event.id}
            className="bg-[#072446] text-white p-6 rounded-lg shadow-lg hover:scale-105 transition-transform"
          >
            <Image
              src={event.image}
              alt={event.name}
              width={400}
              height={200}
              className="rounded-md"
            />
            <CardContent>
              <h3 className="text-xl font-semibold text-[#E1A913] mt-4">
                {event.name}
              </h3>
              <p className="text-[#00b0a6]">{event.date}</p>
              <Button className="mt-4 bg-[#00b0a6] text-[#072446] px-4 py-2">
                Register Now
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
