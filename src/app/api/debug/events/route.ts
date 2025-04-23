import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/server/db/mongo';
import { Event } from '@/server/db/models';
import { isValid } from 'date-fns';

export async function GET() {
  try {
    console.log('Debug API: Fetching events directly from MongoDB');

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

    // Fetch all events from the database
    const events = await Event.find({});
    console.log(`Debug API: Found ${events.length} events in MongoDB`);

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

    // Return the events as JSON
    return NextResponse.json({
      success: true,
      count: events.length,
      events: events.map(event => {
        // Ensure dates are valid
        const startDate = ensureValidDate(event.startDate);
        const endDate = ensureValidDate(event.endDate);

        return {
          id: event.id,
          name: event.name,
          description: event.description,
          startDate,
          endDate,
          location: event.location,
          category: event.category,
          status: event.status || 'published',
          hasImage: !!event.image,
          image: event.image,
          imagePreview: event.image ? event.image.substring(0, 50) + '...' : null
        };
      })
    });
  } catch (error) {
    console.error('Debug API Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
