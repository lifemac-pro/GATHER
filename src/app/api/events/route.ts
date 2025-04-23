import { NextRequest } from "next/server";
import { z } from "zod";
import { Event } from "@/server/db/models";
import { connectToDatabase } from "@/server/db/mongo";
import { AppError, ErrorCode } from "@/utils/error-handling";
import { createApiRouteHandler, createSuccessResponse } from "@/utils/api-route-handler";
import { ApiResponse, EventListResponse, EventResponse } from "@/types/api-responses";

// Define the request schema for creating an event
const createEventSchema = z.object({
  name: z.string().min(3, "Event name must be at least 3 characters"),
  description: z.string().optional(),
  location: z.string().optional(),
  startDate: z.string().transform(str => new Date(str)),
  endDate: z.string().transform(str => new Date(str)),
  category: z.string(),
  price: z.number().min(0).optional(),
  maxAttendees: z.number().int().positive().optional(),
  image: z.string().url().optional(),
});

// Define the query schema for listing events
const listEventsQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 10),
  category: z.string().optional(),
  featured: z.string().optional().transform(val => val === 'true'),
  upcoming: z.string().optional().transform(val => val === 'true'),
});

// Define the request types based on the schemas
type CreateEventRequest = z.infer<typeof createEventSchema>;
type ListEventsQuery = z.infer<typeof listEventsQuerySchema>;

// GET handler for listing events
export const GET = createApiRouteHandler<void>(
  async ({ query }): Promise<Response> => {
    try {
      const parsedQuery = listEventsQuerySchema.parse(query);

      // Build query conditions
      let queryConditions: any = {};

      if (parsedQuery.category) {
        queryConditions.category = parsedQuery.category;
      }

      if (parsedQuery.featured) {
        queryConditions.featured = true;
      }

      if (parsedQuery.upcoming) {
        queryConditions.endDate = { $gte: new Date() };
      }

      // Get events from database
      const page = parsedQuery.page || 1;
      const limit = parsedQuery.limit || 10;
      const skip = (page - 1) * limit;

      console.log('API route: Fetching events with conditions:', queryConditions);

      // Execute query - use a safer approach with direct MongoDB access
      let events = [];
      try {
        console.log('API route: Attempting to fetch events with mongoose model');
        const eventsQuery = Event.find(queryConditions);
        events = await eventsQuery;

        console.log('API route: Found', events.length, 'events with mongoose model');

        // If no events found, try fetching all events
        if (events.length === 0) {
          console.log('API route: No events found with filters, fetching all events');
          events = await Event.find({});
          console.log('API route: Found', events.length, 'events without filters');
        }

        // If still no events, try direct MongoDB access
        if (events.length === 0) {
          console.log('API route: No events found with mongoose, trying direct MongoDB access');
          try {
            const mongoose = await connectToDatabase();
            if (mongoose.connection && mongoose.connection.readyState === 1) {
              const db = mongoose.connection.db;
              if (db) {
                const directEvents = await db.collection('events').find({}).toArray();
                console.log('API route: Found', directEvents.length, 'events with direct MongoDB access');
                events = directEvents;
              }
            } else {
              console.log('API route: MongoDB connection not ready, state:', mongoose.connection?.readyState);
            }
          } catch (directError) {
            console.error('API route: Error with direct MongoDB access:', directError);
          }
        }
      } catch (dbError) {
        console.error('API route: Error fetching events:', dbError);
        // Continue with empty events array
      }

      const totalEvents = events.length;

      // Map to response format
      const items = events.map((event: any) => ({
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

      // Create response
      const response: EventListResponse = {
        items,
        meta: {
          nextCursor: undefined,
          prevCursor: undefined,
          hasMore: page < Math.ceil(totalEvents / limit),
        },
      };

      return createSuccessResponse(response);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to fetch events",
        500,
        { originalError: (error as Error).message }
      );
    }
  },
  {
    querySchema: listEventsQuerySchema,
  }
);

// POST handler for creating an event
export const POST = createApiRouteHandler<CreateEventRequest>(
  async ({ body, session }): Promise<Response> => {
    if (!body) {
      throw new AppError(
        ErrorCode.INVALID_INPUT,
        "Request body is required",
        400
      );
    }

    // Validate dates
    if (new Date(body.endDate) < new Date(body.startDate)) {
      throw new AppError(
        ErrorCode.INVALID_INPUT,
        "End date cannot be before start date",
        400
      );
    }

    try {
      // Connect to MongoDB first
      console.log('API POST: Connecting to MongoDB');
      await connectToDatabase();

      // Create event with timeout
      console.log('API POST: Creating event');
      let event;
      try {
        // Use Promise.race to add a timeout
        event = await Promise.race([
          Event.create({
            name: body.name,
            description: body.description,
            location: body.location,
            startDate: body.startDate,
            endDate: body.endDate,
            category: body.category,
            price: body.price,
            maxAttendees: body.maxAttendees ? [body.maxAttendees.toString()] : undefined,
            createdById: session?.userId || "unknown",
            image: body.image,
            featured: false,
            status: "published",
          }),
          new Promise((_, reject) => setTimeout(() => {
            console.error('API POST: Event creation timed out');
            reject(new Error('Event creation timed out after 30 seconds'));
          }, 30000))
        ]);
      } catch (createError) {
        console.error('API POST: Error creating event:', createError);
        throw new AppError(
          ErrorCode.DATABASE_ERROR,
          "Failed to create event: " + (createError instanceof Error ? createError.message : String(createError)),
          500
        );
      }

      console.log('API POST: Event created successfully with ID:', event.id);

      // Create response
      const response: ApiResponse<EventResponse> = {
        success: true,
        data: {
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
        },
      };

      return createSuccessResponse(response, 201);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to create event",
        500,
        { originalError: (error as Error).message }
      );
    }
  },
  {
    bodySchema: createEventSchema as any,
    requireAuth: true,
  }
);
