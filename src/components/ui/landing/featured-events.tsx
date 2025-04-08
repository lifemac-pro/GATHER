import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar } from "lucide-react";
import { api } from "@/trpc/server";
import { format } from "date-fns";
import { Key, ReactElement, JSXElementConstructor, ReactNode, ReactPortal, AwaitedReactNode } from "react";

export async function FeaturedEvents() {
  const events = await api.event.getFeatured.query();

  return (
    <section className="bg-[#072446] px-4 py-16">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-12 text-center text-3xl font-bold text-[#E1A913] md:text-4xl">
          Featured Events
        </h2>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event: { id: Key | null | undefined; name: string | number | bigint | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<AwaitedReactNode> | null | undefined; startDate: string | number | Date; location: string | number | bigint | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<AwaitedReactNode> | null | undefined; description: string | number | bigint | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<AwaitedReactNode> | null | undefined; }) => (
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
}
