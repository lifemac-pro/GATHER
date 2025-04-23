import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/server/db/mongo';

export async function GET() {
  console.log('Direct API: Using MongoDB connection string:', process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 20) + '...' : 'undefined');
  try {
    console.log('Direct API: Fetching all events without any filtering');

    // Connect to the database
    const mongoose = await connectToDatabase();

    if (!mongoose.connection || mongoose.connection.readyState !== 1) {
      console.error('Direct API: MongoDB connection not ready');
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const db = mongoose.connection.db;
    if (!db) {
      console.error('Direct API: Database object not available');
      return NextResponse.json({ error: 'Database object not available' }, { status: 500 });
    }

    // Fetch all events directly from the database
    console.log('Direct API: Querying events collection directly');
    const events = await db.collection('events').find({}).toArray();

    console.log(`Direct API: Found ${events.length} events directly from MongoDB`);

    // Return the raw events data
    return NextResponse.json(events);
  } catch (error) {
    console.error('Direct API: Error fetching events:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
