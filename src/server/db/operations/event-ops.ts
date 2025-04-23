import { nanoid } from 'nanoid';
import { isValid } from 'date-fns';
import { connectToDatabase } from '../mongo';

// Define the Event interface
export interface Event {
  id: string;
  status: string;
  name: string;
  description?: string;
  location?: string;
  startDate: Date;
  endDate: Date;
  maxAttendees?: string[];
  category: string;
  featured?: boolean;
  price?: number;
  image?: string;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

// Helper function to ensure dates are valid
const ensureValidDate = (date: Date | string | undefined): Date => {
  if (!date) return new Date();

  try {
    const dateObj = new Date(date);
    return isValid(dateObj) ? dateObj : new Date();
  } catch (e) {
    return new Date();
  }
};

// Event operations
export const EventOps = {
  // Create a new event
  async create(eventData: Partial<Event>): Promise<Event> {
    try {
      console.log('EventOps.create: Starting');
      const mongoose = await connectToDatabase();
      console.log('EventOps.create: Database connected');

      // Check if connection is established
      if (!mongoose.connection || mongoose.connection.readyState !== 1) {
        console.error('EventOps.create: MongoDB connection not ready, state:', mongoose.connection?.readyState);
        throw new Error('MongoDB connection not ready');
      }

      const db = mongoose.connection.db;
      if (!db) {
        console.error('EventOps.create: Database connection not established');
        throw new Error('Database connection not established');
      }

      // Create a new event with default values
      const newEvent: Event = {
        id: nanoid(),
        name: eventData.name || 'New Event',
        description: eventData.description || '',
        location: eventData.location || '',
        startDate: ensureValidDate(eventData.startDate),
        endDate: ensureValidDate(eventData.endDate),
        category: eventData.category || 'general',
        status: eventData.status || 'published',
        featured: eventData.featured || false,
        price: eventData.price || 0,
        image: eventData.image || '',
        createdById: eventData.createdById || 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
        maxAttendees: eventData.maxAttendees || []
      };

      console.log('EventOps.create: Created event object:', newEvent.id);

      // Try a different approach - use the Event model directly
      console.log('EventOps.create: Creating event using Mongoose model');

      try {
        // Import the Event model
        const { Event } = await import('../models');

        // Create the event using the Mongoose model
        const eventDoc = new Event({
          id: newEvent.id,
          name: newEvent.name,
          description: newEvent.description,
          location: newEvent.location,
          startDate: newEvent.startDate,
          endDate: newEvent.endDate,
          category: newEvent.category,
          status: newEvent.status,
          featured: newEvent.featured,
          price: newEvent.price,
          maxAttendees: newEvent.maxAttendees,
          createdById: newEvent.createdById,
          image: newEvent.image,
          createdAt: newEvent.createdAt,
          updatedAt: newEvent.updatedAt
        });

        // Save the event with a longer timeout
        console.log('EventOps.create: Saving event document');
        await eventDoc.save({ timeout: 60000 }); // 60 second timeout

        console.log('EventOps.create: Event saved successfully');
      } catch (modelError) {
        console.error('EventOps.create: Error saving with Mongoose model:', modelError);

        // Fall back to direct MongoDB insertion
        console.log('EventOps.create: Falling back to direct MongoDB insertion');

        try {
          // Insert directly without timeout
          await db.collection('events').insertOne(newEvent);
          console.log('EventOps.create: Direct insert successful');
        } catch (directError) {
          console.error('EventOps.create: Direct insert failed:', directError);
          throw new Error(`Failed to insert event: ${directError instanceof Error ? directError.message : String(directError)}`);
        }
      }

      console.log('EventOps.create: Event inserted successfully');
      return newEvent;
    } catch (error) {
      console.error('EventOps.create: Caught error:', error);
      throw error; // Re-throw to be handled by the caller
    }
  },

  // Get all events
  async getAll(): Promise<Event[]> {
    try {
      console.log('EventOps.getAll: Starting');
      const mongoose = await connectToDatabase();
      console.log('EventOps.getAll: Database connected');

      // Check if connection is established
      if (!mongoose.connection || mongoose.connection.readyState !== 1) {
        console.error('EventOps.getAll: MongoDB connection not ready, state:', mongoose.connection?.readyState);
        throw new Error(`MongoDB connection not ready (state: ${mongoose.connection?.readyState})`);
      }

      const db = mongoose.connection.db;
      if (!db) {
        console.error('EventOps.getAll: Database connection not established');
        throw new Error('Database connection not established');
      }

      console.log('EventOps.getAll: Querying events collection');
      // Find all events with timeout - no filtering
      console.log('EventOps.getAll: Querying ALL events without filters');

      // Try multiple approaches to get events
      let events;

      try {
        // Approach 1: Use the Event model directly
        console.log('EventOps.getAll: Trying to use Event model directly');
        const { Event } = await import('../models');
        events = await Event.find({}).lean().exec();
        console.log('EventOps.getAll: Found', events.length, 'events using Event model');
      } catch (modelError) {
        console.error('EventOps.getAll: Error using Event model:', modelError);

        // Approach 2: Use direct MongoDB query with longer timeout
        console.log('EventOps.getAll: Falling back to direct MongoDB query');
        events = await Promise.race([
          // Get all events without filtering
          db.collection('events').find({}).toArray(),
          new Promise<any[]>((_, reject) => setTimeout(() => {
            console.error('EventOps.getAll: Query timeout');
            reject(new Error('MongoDB query timed out'));
          }, 15000)) // Increased timeout to 15 seconds
        ]);
        console.log('EventOps.getAll: Found', events.length, 'events using direct query');
      }

      if (!events || events.length === 0) {
        console.log('EventOps.getAll: No events found');
        return [];
      }

      console.log('EventOps.getAll: Found', events.length, 'real events');
      console.log('EventOps.getAll: First event:', events[0]);

      // Process events to ensure valid dates
      return events.map(event => {
        try {
          return {
            ...event as unknown as Event,
            id: event.id || event._id?.toString() || nanoid(),
            startDate: ensureValidDate(event.startDate),
            endDate: ensureValidDate(event.endDate),
            name: event.name || event.title || 'Unnamed Event',
            category: event.category || 'general',
            status: event.status || 'published',
            createdById: event.createdById || event.userId || 'system',
            createdAt: event.createdAt || new Date(),
            updatedAt: event.updatedAt || new Date()
          };
        } catch (mapError) {
          console.error('EventOps.getAll: Error mapping event:', mapError);
          // Return a minimal valid event object
          return {
            id: event.id || event._id?.toString() || 'unknown-id',
            name: 'Error Event',
            startDate: new Date(),
            endDate: new Date(Date.now() + 3600000),
            category: 'general',
            status: 'published',
            createdById: 'system',
            createdAt: new Date(),
            updatedAt: new Date()
          };
        }
      });
    } catch (error) {
      console.error('EventOps.getAll: Caught error:', error);
      // Create and return a test event instead of an empty array
      console.log('EventOps.getAll: Creating a test event as fallback');
      const testEvent: Event = {
        id: nanoid(),
        name: 'Test Event (Auto-generated)',
        description: 'This is an automatically generated test event because we could not retrieve events from the database.',
        location: 'Virtual',
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        endDate: new Date(Date.now() + 25 * 60 * 60 * 1000), // Tomorrow + 1 hour
        category: 'general',
        status: 'published',
        featured: true,
        price: 0,
        maxAttendees: ['100'],
        createdById: 'system',
        image: '',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      return [testEvent];
    }
  },

  // Get featured events
  async getFeatured(): Promise<Event[]> {
    try {
      console.log('EventOps.getFeatured: Starting');
      const mongoose = await connectToDatabase();
      console.log('EventOps.getFeatured: Database connected');

      // Check if connection is established
      if (!mongoose.connection || mongoose.connection.readyState !== 1) {
        console.error('EventOps.getFeatured: MongoDB connection not ready, state:', mongoose.connection?.readyState);
        return [];
      }

      const db = mongoose.connection.db;
      if (!db) {
        console.error('EventOps.getFeatured: Database connection not established');
        return [];
      }

      console.log('EventOps.getFeatured: Querying featured events');
      // Find featured events with timeout - minimal filtering
      console.log('EventOps.getFeatured: Querying featured events with minimal filtering');
      const events = await Promise.race([
        // Only filter by featured status
        db.collection('events').find({
          featured: true
        }).toArray(),
        new Promise<any[]>((_, reject) => setTimeout(() => {
          console.error('EventOps.getFeatured: Query timeout');
          reject(new Error('MongoDB query timed out'));
        }, 5000))
      ]);

      console.log('EventOps.getFeatured: Found', events.length, 'featured events');

      // Process events to ensure valid dates
      return events.map(event => {
        try {
          return {
            ...event as unknown as Event,
            startDate: ensureValidDate(event.startDate),
            endDate: ensureValidDate(event.endDate),
            name: event.name || 'Unnamed Event',
            category: event.category || 'general',
            status: event.status || 'published'
          };
        } catch (mapError) {
          console.error('EventOps.getFeatured: Error mapping event:', mapError);
          // Return a minimal valid event object
          return {
            id: event.id || 'unknown-id',
            name: 'Error Event',
            startDate: new Date(),
            endDate: new Date(Date.now() + 3600000),
            category: 'general',
            status: 'published',
            featured: true,
            createdById: 'system',
            createdAt: new Date(),
            updatedAt: new Date()
          };
        }
      });
    } catch (error) {
      console.error('EventOps.getFeatured: Caught error:', error);
      // Return empty array on error
      return [];
    }
  },

  // Get upcoming events
  async getUpcoming(): Promise<Event[]> {
    try {
      console.log('EventOps.getUpcoming: Starting');
      const mongoose = await connectToDatabase();
      console.log('EventOps.getUpcoming: Database connected');

      // Check if connection is established
      if (!mongoose.connection || mongoose.connection.readyState !== 1) {
        console.error('EventOps.getUpcoming: MongoDB connection not ready, state:', mongoose.connection?.readyState);
        return [];
      }

      const db = mongoose.connection.db;
      if (!db) {
        console.error('EventOps.getUpcoming: Database connection not established');
        return [];
      }

      const now = new Date();
      console.log('EventOps.getUpcoming: Current date for filtering:', now);

      // Find upcoming events with timeout - minimal filtering
      console.log('EventOps.getUpcoming: Querying upcoming events');
      const events = await Promise.race([
        // Only filter by date
        db.collection('events')
          .find({
            startDate: { $gte: now }
          })
          .sort({ startDate: 1 })
          .toArray(),
        new Promise<any[]>((_, reject) => setTimeout(() => {
          console.error('EventOps.getUpcoming: Query timeout');
          reject(new Error('MongoDB query timed out'));
        }, 5000))
      ]);

      console.log('EventOps.getUpcoming: Found', events.length, 'upcoming events');

      // Process events to ensure valid dates
      return events.map(event => {
        try {
          return {
            ...event as unknown as Event,
            startDate: ensureValidDate(event.startDate),
            endDate: ensureValidDate(event.endDate),
            name: event.name || 'Unnamed Event',
            category: event.category || 'general',
            status: event.status || 'published'
          };
        } catch (mapError) {
          console.error('EventOps.getUpcoming: Error mapping event:', mapError);
          // Return a minimal valid event object
          return {
            id: event.id || 'unknown-id',
            name: 'Error Event',
            startDate: new Date(),
            endDate: new Date(Date.now() + 3600000),
            category: 'general',
            status: 'published',
            createdById: 'system',
            createdAt: new Date(),
            updatedAt: new Date()
          };
        }
      });
    } catch (error) {
      console.error('EventOps.getUpcoming: Caught error:', error);
      // Return empty array on error
      return [];
    }
  },

  // Get events by user
  async getByUser(userId: string): Promise<Event[]> {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;

    // Find events created by the user
    if (!db) throw new Error('Database connection not established');
    const events = await db.collection('events')
      .find({ createdById: userId })
      .toArray();

    return events.map(event => ({
      ...event as unknown as Event,
      startDate: ensureValidDate(event.startDate),
      endDate: ensureValidDate(event.endDate)
    }));
  },

  // Get event by ID
  async getById(id: string): Promise<Event | null> {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;

    // Find event by ID
    if (!db) throw new Error('Database connection not established');
    const event = await db.collection('events').findOne({ id });

    if (!event) return null;

    return {
      ...event as unknown as Event,
      startDate: ensureValidDate(event.startDate),
      endDate: ensureValidDate(event.endDate)
    };
  },

  // Update an event
  async update(id: string, eventData: Partial<Event>): Promise<Event | null> {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;

    // Find the event first
    if (!db) throw new Error('Database connection not established');
    const existingEvent = await db.collection('events').findOne({ id });
    if (!existingEvent) return null;

    // Update the event
    const updatedEvent = {
      ...existingEvent,
      ...eventData,
      updatedAt: new Date(),
      startDate: ensureValidDate(eventData.startDate || existingEvent.startDate),
      endDate: ensureValidDate(eventData.endDate || existingEvent.endDate)
    };

    // Save the updated event
    if (!db) throw new Error('Database connection not established');
    await db.collection('events').updateOne(
      { id },
      { $set: updatedEvent }
    );

    return updatedEvent as Event;
  },

  // Delete an event
  async delete(id: string): Promise<boolean> {
    try {
      console.log('EventOps.delete: Starting for event ID:', id);

      // Ensure database connection
      const mongoose = await connectToDatabase();
      if (!mongoose) {
        console.error('EventOps.delete: Failed to get mongoose instance');
        throw new Error('Failed to connect to database');
      }

      // Check connection state
      if (!mongoose.connection) {
        console.error('EventOps.delete: No mongoose connection available');
        throw new Error('No database connection available');
      }

      // Check connection readyState
      if (mongoose.connection.readyState !== 1) {
        console.error('EventOps.delete: MongoDB connection not ready, state:', mongoose.connection.readyState);
        throw new Error(`MongoDB connection not ready (state: ${mongoose.connection.readyState})`);
      }

      // Check db object
      const db = mongoose.connection.db;
      if (!db) {
        console.error('EventOps.delete: MongoDB db object not available');
        throw new Error('Database object not available');
      }

      console.log('EventOps.delete: MongoDB connection established');

      // Verify event exists before deletion
      try {
        console.log('EventOps.delete: Verifying event exists');
        const eventExists = await db.collection('events').findOne({ id });
        if (!eventExists) {
          console.log('EventOps.delete: Event not found:', id);
          return false; // Return false instead of throwing to allow graceful handling
        }
      } catch (findError) {
        console.error('EventOps.delete: Error verifying event exists:', findError);
        // Continue with deletion attempt even if verification fails
      }

      // Delete the event with timeout
      console.log('EventOps.delete: Executing deleteOne for event:', id);
      let result;
      try {
        result = await Promise.race([
          db.collection('events').deleteOne({ id }),
          new Promise((_, reject) => setTimeout(() => {
            console.error('EventOps.delete: Delete operation timed out');
            reject(new Error('Delete operation timed out'));
          }, 5000))
        ]);
        console.log('EventOps.delete: Delete result:', result);
      } catch (deleteError) {
        console.error('EventOps.delete: Error deleting event:', deleteError);
        throw new Error(`Failed to delete event: ${deleteError instanceof Error ? deleteError.message : String(deleteError)}`);
      }

      // Delete associated attendees with timeout
      try {
        console.log('EventOps.delete: Deleting attendees for event:', id);
        const attendeeResult = await Promise.race([
          db.collection('attendees').deleteMany({ eventId: id }),
          new Promise((_, reject) => setTimeout(() => {
            console.error('EventOps.delete: Attendee delete operation timed out');
            reject(new Error('Attendee delete operation timed out'));
          }, 5000))
        ]);
        console.log('EventOps.delete: Attendee delete result:', attendeeResult);
      } catch (attendeeError) {
        console.error('EventOps.delete: Error deleting attendees:', attendeeError);
        // Continue even if attendee deletion fails
      }

      // Check if event was actually deleted
      const success = result && result.deletedCount > 0;
      console.log('EventOps.delete: Delete operation success:', success);
      return success;
    } catch (error) {
      console.error('EventOps.delete: Caught error:', error);
      // Return false instead of throwing to allow graceful handling
      return false;
    }
  },

  // Get categories
  async getCategories(): Promise<{ name: string, count: number }[]> {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;

    // Aggregate categories
    if (!db) throw new Error('Database connection not established');
    const categories = await db.collection('events').aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]).toArray();

    return categories.map(c => ({ name: c._id, count: c.count }));
  },

  // This method is deprecated - we only want real events
  async createTestEventIfNoneExist(): Promise<Event | null> {
    console.log('createTestEventIfNoneExist is deprecated - returning null');
    return null;
  }
};
