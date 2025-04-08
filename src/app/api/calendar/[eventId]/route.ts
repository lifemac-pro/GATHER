import { db } from "@/server/db";
import { events } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { format } from "date-fns";

export async function GET(
  request: Request,
  { params }: { params: { eventId: string } }
) {
  try {
    // Get event details
    const event = await db
      .select()
      .from(events)
      .where(eq(events.id, params.eventId))
      .limit(1);

    if (!event.length) {
      return new Response("Event not found", { status: 404 });
    }

    const { name, description, startDate, endDate, location } = event[0];

    // Generate iCal content
    const icalContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//GatherEase//EN",
      "BEGIN:VEVENT",
      `UID:${params.eventId}@gatherease.com`,
      `DTSTAMP:${format(new Date(), "yyyyMMdd'T'HHmmss'Z'")}`,
      `DTSTART:${format(startDate, "yyyyMMdd'T'HHmmss'Z'")}`,
      `DTEND:${format(endDate, "yyyyMMdd'T'HHmmss'Z'")}`,
      `SUMMARY:${name}`,
      `DESCRIPTION:${description || ""}`,
      `LOCATION:${location || ""}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    // Return calendar file
    return new Response(icalContent, {
      headers: {
        "Content-Type": "text/calendar",
        "Content-Disposition": `attachment; filename="${name}.ics"`,
      },
    });
  } catch (error) {
    console.error("Error generating calendar:", error);
    return new Response("Error generating calendar", { status: 500 });
  }
}
