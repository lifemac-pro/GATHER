import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { env } from "@/env";

export async function GET() {
  try {
    console.log("Direct API: Starting direct database query");

    // Connect directly to MongoDB using the connection string
    if (!env.DATABASE_URL) {
      console.error("Direct API: DATABASE_URL is not defined");
      return NextResponse.json(
        { error: "Database connection string not defined" },
        { status: 500 },
      );
    }

    console.log(
      "Direct API: Connecting to MongoDB with URL:",
      env.DATABASE_URL.substring(0, 20) + "...",
    );

    // Use a clean connection options object
    const connectionOptions = {
      serverSelectionTimeoutMS: 60000,
      socketTimeoutMS: 300000,
      connectTimeoutMS: 60000,
      maxPoolSize: 20,
      minPoolSize: 5,
      retryWrites: true,
      retryReads: true,
      autoIndex: true,
      family: 4,
    };

    // Connect to MongoDB
    await mongoose.connect(env.DATABASE_URL, connectionOptions);
    console.log("Direct API: Connected to MongoDB");

    // Check if connection is established
    if (mongoose.connection.readyState !== 1) {
      console.error(
        "Direct API: MongoDB connection not ready, state:",
        mongoose.connection.readyState,
      );
      return NextResponse.json(
        { error: "Database connection not ready" },
        { status: 500 },
      );
    }

    // Get the database object
    const db = mongoose.connection.db;
    if (!db) {
      console.error("Direct API: Database object not available");
      return NextResponse.json(
        { error: "Database object not available" },
        { status: 500 },
      );
    }

    // List all collections
    const collections = await db.listCollections().toArray();
    console.log(
      "Direct API: Available collections:",
      collections.map((c) => c.name),
    );

    // Check if events collection exists
    if (!collections.some((c) => c.name === "events")) {
      console.error("Direct API: Events collection does not exist");
      return NextResponse.json(
        { error: "Events collection does not exist" },
        { status: 404 },
      );
    }

    // Fetch all events directly from the database
    console.log("Direct API: Querying events collection directly");
    const rawEvents = await db.collection("events").find({}).toArray();

    console.log(
      `Direct API: Found ${rawEvents.length} events directly from MongoDB`,
    );

    // Log the raw events for debugging
    console.log(
      "Direct API: Raw events sample:",
      rawEvents.slice(0, 2).map((e) => {
        const { _id, ...rest } = e;
        return { _id: _id?.toString(), ...rest };
      }),
    );

    // Transform the events to the expected format
    const events = rawEvents.map((event) => {
      // Extract the _id field and convert to string
      const _idString = event._id ? event._id.toString() : "unknown-id";

      // Create a standardized event object with all possible field names
      return {
        // Use all possible ID field names
        id: event.id || _idString,
        _id: _idString,

        // Use all possible name field names
        name: event.name || event.title || event.eventName || "Unnamed Event",

        // Use all possible description field names
        description:
          event.description || event.desc || event.eventDescription || "",

        // Use all possible location field names
        location: event.location || event.venue || event.eventLocation || "",

        // Use all possible date field names
        startDate:
          event.startDate || event.start_date || event.eventStart || new Date(),
        endDate:
          event.endDate || event.end_date || event.eventEnd || new Date(),

        // Use all possible category field names
        category:
          event.category || event.eventCategory || event.type || "general",

        // Use all possible status field names
        status: event.status || event.eventStatus || "published",

        // Use all possible featured field names
        featured: event.featured || event.isFeatured || false,

        // Use all possible price field names
        price: event.price || event.eventPrice || event.cost || 0,

        // Use all possible attendees field names
        maxAttendees: event.maxAttendees ||
          event.max_attendees ||
          event.attendeeLimit || ["100"],

        // Use all possible creator field names
        createdById:
          event.createdById ||
          event.created_by ||
          event.userId ||
          event.organizer ||
          "user-id",

        // Use all possible image field names
        image: event.image || event.eventImage || event.thumbnail || "",

        // Use all possible date field names
        createdAt:
          event.createdAt ||
          event.created_at ||
          event.dateCreated ||
          new Date(),
        updatedAt:
          event.updatedAt ||
          event.updated_at ||
          event.dateUpdated ||
          new Date(),

        // Include all original fields
        ...event,
      };
    });

    // Log some details about the transformed events
    if (events.length > 0) {
      console.log("Direct API: First transformed event details:", {
        id: events[0].id,
        name: events[0].name,
        category: events[0].category,
        createdById: events[0].createdById || "unknown",
      });
    }

    // Return the transformed events
    return NextResponse.json(events);
  } catch (error) {
    console.error("Direct API: Error fetching events:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  } finally {
    // Close the connection
    try {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
        console.log("Direct API: MongoDB connection closed");
      }
    } catch (closeError) {
      console.error(
        "Direct API: Error closing MongoDB connection:",
        closeError,
      );
    }
  }
}
