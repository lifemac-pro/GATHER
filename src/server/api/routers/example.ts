import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "@/server/api/trpc";
import { AppError, ErrorCode } from "@/utils/error-handling";
import { ApiResponse, EventListResponse, EventResponse } from "@/types/api-responses";
import { Event } from "@/server/db/models";

// Input validation schemas
const getEventSchema = z.object({
  id: z.string().min(1, "Event ID is required"),
});

const createEventSchema = z.object({
  name: z.string().min(3, "Event name must be at least 3 characters"),
  description: z.string().optional(),
  location: z.string().optional(),
  startDate: z.date(),
  endDate: z.date(),
  category: z.string(),
  price: z.number().min(0).optional(),
  maxAttendees: z.number().int().positive().optional(),
});

export const exampleRouter = createTRPCRouter({
  /**
   * Get a list of events with proper typing
   */
  getEvents: publicProcedure
    .query(async (): Promise<EventListResponse> => {
      try {
        // Get events from database
        const events = await Event.findFeatured();

        // Map to response format
        const items = events.map(event => ({
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

        return {
          items,
          meta: {
            nextCursor: undefined,
            prevCursor: undefined,
            hasMore: false,
          }
        };
      } catch (error) {
        // This will be caught by our error handling middleware
        throw new AppError(
          ErrorCode.DATABASE_ERROR,
          "Failed to fetch events",
          500
        );
      }
    }),

  /**
   * Get a single event by ID with proper typing
   */
  getEvent: publicProcedure
    .input(getEventSchema)
    .query(async ({ input }): Promise<ApiResponse<EventResponse>> => {
      try {
        const event = await Event.findById(input.id);

        if (!event) {
          throw new AppError(
            ErrorCode.NOT_FOUND,
            `Event with ID ${input.id} not found`,
            404
          );
        }

        return {
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
          }
        };
      } catch (error) {
        if (error instanceof AppError) {
          throw error;
        }

        throw new AppError(
          ErrorCode.DATABASE_ERROR,
          "Failed to fetch event",
          500
        );
      }
    }),

  /**
   * Create a new event with proper typing and validation
   */
  createEvent: protectedProcedure
    .input(createEventSchema)
    .mutation(async ({ input, ctx }): Promise<ApiResponse<EventResponse>> => {
      try {
        // Validate dates
        if (input.endDate < input.startDate) {
          throw new AppError(
            ErrorCode.INVALID_INPUT,
            "End date cannot be before start date",
            400
          );
        }

        // Create event
        const event = await Event.create({
          name: input.name,
          description: input.description,
          location: input.location,
          startDate: input.startDate,
          endDate: input.endDate,
          category: input.category,
          price: input.price,
          maxAttendees: input.maxAttendees ? [input.maxAttendees.toString()] : undefined,
          createdById: (ctx as any).session?.userId || "unknown",
          featured: false,
          status: "published",
        });

        return {
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
          }
        };
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
    }),
});
