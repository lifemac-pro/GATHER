import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { connectToDatabase } from '@/server/db/mongo';
import { Event } from '@/server/db/models';

export async function POST(request: NextRequest) {
  try {
    console.log('Direct API: Creating event');
    
    // Parse the request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.startDate || !body.endDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Validate dates
    if (new Date(body.endDate) < new Date(body.startDate)) {
      return NextResponse.json(
        { error: 'End date cannot be before start date' },
        { status: 400 }
      );
    }
    
    // Connect to MongoDB
    console.log('Direct API: Connecting to MongoDB');
    await connectToDatabase();
    
    // Create event ID
    const eventId = nanoid();
    console.log('Direct API: Generated event ID:', eventId);
    
    // Create event object
    const eventData = {
      id: eventId,
      name: body.name,
      description: body.description || '',
      location: body.location || '',
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      category: body.category || 'general',
      price: body.price || 0,
      maxAttendees: body.maxAttendees ? [body.maxAttendees.toString()] : ['100'],
      createdById: body.userId || 'user-id',
      image: body.image || '',
      featured: body.featured || false,
      status: 'published',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    console.log('Direct API: Event data prepared');
    
    // Try multiple approaches to save the event
    let event;
    let success = false;
    let error = null;
    
    // Approach 1: Use Mongoose model
    try {
      console.log('Direct API: Trying to save with Mongoose model');
      event = new Event(eventData);
      await event.save({ timeout: 60000 }); // 60 second timeout
      console.log('Direct API: Event saved with Mongoose model');
      success = true;
    } catch (modelError) {
      console.error('Direct API: Error saving with Mongoose model:', modelError);
      error = modelError;
      
      // Approach 2: Use direct MongoDB insertion
      try {
        console.log('Direct API: Trying direct MongoDB insertion');
        const mongoose = await connectToDatabase();
        if (mongoose.connection && mongoose.connection.readyState === 1) {
          const db = mongoose.connection.db;
          if (db) {
            await db.collection('events').insertOne(eventData);
            console.log('Direct API: Event saved with direct MongoDB insertion');
            event = eventData;
            success = true;
          }
        }
      } catch (directError) {
        console.error('Direct API: Error with direct MongoDB insertion:', directError);
        error = directError;
      }
    }
    
    // Return response
    if (success) {
      return NextResponse.json({
        success: true,
        data: event
      }, { status: 201 });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to create event',
        details: error instanceof Error ? error.message : String(error)
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Direct API: Unhandled error creating event:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create event',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
