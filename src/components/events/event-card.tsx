"use client";

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { CalendarIcon, MapPinIcon, Clock } from "lucide-react";
import Link from "next/link";
import { EventImage } from "./event-image";

interface EventCardProps {
  id: string;
  name: string;
  description?: string;
  location?: string;
  startDate: Date;
  endDate: Date;
  category: string;
  price?: number;
  image?: string;
  attendeeCount?: number;
}

export function EventCard({
  id,
  name,
  description,
  location,
  startDate,
  endDate,
  category,
  price,
  image,
  attendeeCount,
}: EventCardProps) {
  return (
    <Card className="h-full overflow-hidden transition-all hover:shadow-md border-border hover:border-primary/20">
      <div className="relative">
        <EventImage src={image} alt={name} />
        <Badge variant="secondary" className="absolute right-2 top-2">{category}</Badge>
      </div>

      <CardHeader className="pb-2">
        <div className="space-y-1">
          <h3 className="line-clamp-1 text-xl font-bold text-foreground">{name}</h3>
          <div className="flex items-center text-sm text-muted-foreground">
            <CalendarIcon className="mr-1 h-4 w-4" />
            <span>{format(new Date(startDate), "PPP")}</span>
          </div>
          {location && (
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPinIcon className="mr-1 h-4 w-4" />
              <span className="line-clamp-1">{location}</span>
            </div>
          )}
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="mr-1 h-4 w-4" />
            <span>
              {format(new Date(startDate), "p")} - {format(new Date(endDate), "p")}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{description}</p>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        <div>
          {price !== undefined && price > 0 ? (
            <span className="font-semibold text-primary">${price.toFixed(2)}</span>
          ) : (
            <span className="text-sm text-muted-foreground">Free</span>
          )}
          {attendeeCount !== undefined && (
            <span className="ml-2 text-xs text-muted-foreground">
              {attendeeCount} {attendeeCount === 1 ? "attendee" : "attendees"}
            </span>
          )}
        </div>
        <Link href={`/events/${id}`}>
          <Button size="sm">View Details</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
