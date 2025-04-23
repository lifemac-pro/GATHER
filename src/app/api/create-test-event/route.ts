import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { env } from "@/env";
import { nanoid } from "nanoid";

export async function GET() {
  try {
    console.log("Create Test Event API: Starting");

    // Connect directly to MongoDB using the connection string
    if (!env.DATABASE_URL) {
      console.error("Create Test Event API: DATABASE_URL is not defined");
      return NextResponse.json(
        { error: "Database connection string not defined" },
        { status: 500 },
      );
    }

    console.log(
      "Create Test Event API: Connecting to MongoDB with URL:",
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
    console.log("Create Test Event API: Connected to MongoDB");

    // Check if connection is established
    if (mongoose.connection.readyState !== 1) {
      console.error(
        "Create Test Event API: MongoDB connection not ready, state:",
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
      console.error("Create Test Event API: Database object not available");
      return NextResponse.json(
        { error: "Database object not available" },
        { status: 500 },
      );
    }

    // Create a test event
    const testEvent = {
      id: nanoid(),
      name: `Test Event ${new Date().toISOString()}`,
      description: "This is a test event created via the API",
      location: "Test Location",
      startDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      endDate: new Date(Date.now() + 25 * 60 * 60 * 1000), // Tomorrow + 1 hour
      category: "test",
      status: "published",
      featured: true,
      price: 0,
      maxAttendees: ["100"],
      createdById: "test-user",
      image: "https://via.placeholder.com/300",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Insert the test event
    console.log("Create Test Event API: Inserting test event");
    const result = await db.collection("events").insertOne(testEvent);

    console.log(
      "Create Test Event API: Test event inserted with ID:",
      result.insertedId,
    );

    // Return success
    return NextResponse.json({
      success: true,
      message: "Test event created successfully",
      event: {
        ...testEvent,
        _id: result.insertedId.toString(),
      },
    });
  } catch (error) {
    console.error("Create Test Event API: Error creating test event:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  } finally {
    // Close the connection
    try {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
        console.log("Create Test Event API: MongoDB connection closed");
      }
    } catch (closeError) {
      console.error(
        "Create Test Event API: Error closing MongoDB connection:",
        closeError,
      );
    }
  }
}
