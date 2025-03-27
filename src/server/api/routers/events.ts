import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/server/db/index";
import Event from "@/server/db/models/event";

export async function POST(req: NextRequest) {
  await connectDB();

  try {
    const { title, date, time, location, image } = await req.json();
    if (!title || !date || !time || !location || !image) {
      return NextResponse.json({ message: "All fields are required" }, { status: 400 });
    }

    const event = await Event.create({ title, date, time, location, image });
    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Error creating event" }, { status: 500 });
  }
}

export async function GET() {
  await connectDB();

  try {
    const events = await Event.find().populate("attendees");
    return NextResponse.json(events);
  } catch (error) {
    return NextResponse.json({ error: "Error fetching events" }, { status: 500 });
  }
}
