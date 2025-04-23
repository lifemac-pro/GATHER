import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/server/db/mongo';
import { Event } from '@/server/db/models';
import { nanoid } from 'nanoid';
import { isValid } from 'date-fns';

export async function POST(request: NextRequest) {
  try {
    console.log('Debug API: Creating event directly in MongoDB');

    // Parse the request body
    const body = await request.json();
    console.log('Debug API: Event data received:', {
      ...body,
      image: body.image ? 'Image data present (truncated)' : 'No image data'
    });

    // Connect to the database with retry logic
    let connected = false;
    let retries = 0;
    const maxRetries = 3;

    while (!connected && retries < maxRetries) {
      try {
        console.log(`Debug API: Connecting to MongoDB (attempt ${retries + 1}/${maxRetries})`);
        const mongoose = await connectToDatabase();
        connected = mongoose.connection.readyState === 1;

        if (connected) {
          console.log('Debug API: Successfully connected to MongoDB');
        } else {
          console.log(`Debug API: MongoDB connection state: ${mongoose.connection.readyState}`);
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`Debug API: MongoDB connection error (attempt ${retries + 1}/${maxRetries}):`, error);
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      retries++;
    }

    if (!connected) {
      throw new Error(`Failed to connect to MongoDB after ${maxRetries} attempts`);
    }

    console.log('Debug API: Connected to MongoDB');

    // Helper function to ensure dates are valid
    const ensureValidDate = (date: any) => {
      if (!date) return new Date();

      try {
        const dateObj = new Date(date);
        return isValid(dateObj) ? dateObj : new Date();
      } catch (e) {
        return new Date();
      }
    };

    // Create the event with validated dates
    const newEvent = {
      id: nanoid(),
      ...body,
      startDate: ensureValidDate(body.startDate),
      endDate: ensureValidDate(body.endDate),
      createdById: body.createdById || 'debug-user',
      createdAt: new Date(),
      updatedAt: new Date(),
      status: body.status || 'published',
    };

    console.log('Debug API: Processed event data:', {
      id: newEvent.id,
      name: newEvent.name,
      startDate: newEvent.startDate,
      endDate: newEvent.endDate,
      status: newEvent.status
    });

    // Save to MongoDB
    const event = await Event.create(newEvent);
    console.log('Debug API: Event created in MongoDB:', event.id);

    // Return success response with validated dates
    return NextResponse.json({
      success: true,
      event: {
        id: event.id,
        name: event.name,
        description: event.description,
        startDate: ensureValidDate(event.startDate),
        endDate: ensureValidDate(event.endDate),
        location: event.location,
        category: event.category,
        status: event.status || 'published',
        hasImage: !!event.image,
        image: event.image
      }
    });
  } catch (error) {
    console.error('Debug API Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
