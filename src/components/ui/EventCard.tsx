import React from "react";
import Image from "next/image";
import { Pencil, Trash, Eye } from "lucide-react";
import Link from "next/link";

interface Event {
  id: string;
  title: string;
  image?: string; // Make image optional
  date: string;
  time: string;
  location: string;
}

export default function EventCard({ event }: { event: Event }) {
  // Ensure the image URL is valid
  const validImageUrl = event.image && event.image.startsWith("http") 
    ? event.image 
    : "/images/default-placeholder.jpg"; // Fallback to a default image

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      {/* Event Thumbnail */}
      <div className="h-40 w-full relative">
        <Image
          src={validImageUrl} // Ensure a valid image URL
          alt={event.title || "Event Image"}
          layout="fill"
          objectFit="cover"
          className="rounded-t-lg"
        />
      </div>

      {/* Event Details */}
      <div className="p-4">
        <h2 className="text-lg font-bold">{event.title}</h2>
        <p className="text-gray-600">{event.date} • {event.time}</p>
        <p className="text-gray-500">{event.location}</p>

        {/* Actions */}
        <div className="flex justify-between mt-4">
          <button className="text-blue-500 hover:text-blue-700 flex items-center">
            <Pencil size={18} className="mr-1" /> Edit
          </button>

          {/* View Button: Navigates to Event Details Page */}
          <Link href={`/admin/events?id=${event.id}`} passHref>
            <button className="text-green-500 hover:text-green-700 flex items-center">
              <Eye size={18} className="mr-1" /> View
            </button>
          </Link>

          <button className="text-red-500 hover:text-red-700 flex items-center">
            <Trash size={18} className="mr-1" /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}
