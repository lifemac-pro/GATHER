import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/server/db/mongo';
import { Event } from '@/server/db/models';

export async function GET() {
  try {
    console.log('Direct API: Fetching upcoming events');

    // Connect to the database
    await connectToDatabase();

    // Fetch upcoming events (events that haven't ended yet)
    const now = new Date();
    console.log('Direct API: Querying upcoming events after', now);
    let events = [];
    try {
      events = await Event.find({ endDate: { $gte: now } }).sort({ startDate: 1 });
      console.log(`Direct API: Found ${events.length} upcoming events`);
    } catch (modelError) {
      console.error('Direct API: Error fetching upcoming events with model:', modelError);
    }

    // If no upcoming events, try fetching all events
    let finalEvents = events;
    if (events.length === 0) {
      try {
        console.log('Direct API: No upcoming events found, fetching all events');
        finalEvents = await Event.find({});
        console.log(`Direct API: Found ${finalEvents.length} total events`);
      } catch (allEventsError) {
        console.error('Direct API: Error fetching all events with model:', allEventsError);
      }
    }

    // If still no events, try direct MongoDB access
    if (finalEvents.length === 0) {
      try {
        console.log('Direct API: No events found with mongoose, trying direct MongoDB access');
        const mongoose = await connectToDatabase();
        const db = mongoose.connection.db;
        if (db) {
          // First try upcoming events
          let directEvents = await db.collection('events').find({ endDate: { $gte: now } }).sort({ startDate: 1 }).toArray();
          if (directEvents.length === 0) {
            // If no upcoming events, get all events
            directEvents = await db.collection('events').find({}).toArray();
          }
          console.log('Direct API: Found', directEvents.length, 'events with direct MongoDB access');
          finalEvents = directEvents;
        }
      } catch (directError) {
        console.error('Direct API: Error with direct MongoDB access:', directError);
      }
    }

    // Map to response format
    const items = finalEvents.map((event: any) => ({
      id: event.id,
      name: event.name,
      description: event.description,
      location: event.location,
      startDate: event.startDate,
      endDate: event.endDate,
      category: event.category,
      price: event.price,
      maxAttendees: event.maxAttendees,
      createdById: event.createdById,
      image: event.image,
      featured: event.featured,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    }));

    return NextResponse.json(items);
  } catch (error) {
    console.error('Direct API: Error fetching upcoming events:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
