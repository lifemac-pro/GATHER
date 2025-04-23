import { NextRequest } from "next/server";
import { z } from "zod";
import { Event } from "@/server/db/models";
import { Attendee } from "@/server/db/models/attendee";
import { AppError, ErrorCode } from "@/utils/error-handling";
import {
  createApiRouteHandler,
  createSuccessResponse,
} from "@/utils/api-route-handler";
import { type ApiResponse, type EventResponse } from "@/types/api-responses";

// Define the path parameter schema
const eventParamsSchema = z.object({
  id: z.string().min(1, "Event ID is required"),
});

// Define the update event schema
const updateEventSchema = z.object({
  name: z
    .string()
    .min(3, "Event name must be at least 3 characters")
    .optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  startDate: z
    .string()
    .transform((str) => new Date(str))
    .optional(),
  endDate: z
    .string()
    .transform((str) => new Date(str))
    .optional(),
  category: z.string().optional(),
  price: z.number().min(0).optional(),
  maxAttendees: z.number().int().positive().optional(),
  image: z.string().url().optional(),
  featured: z.boolean().optional(),
  status: z.enum(["draft", "published", "cancelled", "completed"]).optional(),
});

// Define the request types based on the schemas
type UpdateEventRequest = z.infer<typeof updateEventSchema>;

// GET handler for retrieving a specific event
export const GET = createApiRouteHandler<void>(
  async ({ params }): Promise<Response> => {
    try {
      // Get event from database
      // Use a safer approach to find the event
      const event = await Event.findById(params.id || "");

      if (!event) {
        throw new AppError(
          ErrorCode.NOT_FOUND,
          `Event with ID ${params.id} not found`,
          404,
        );
      }

      // Get attendee count
      const attendeeCount = await Attendee.countDocuments({
        eventId: params.id,
      });

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
          attendeeCount,
        },
      };

      return createSuccessResponse(response);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to fetch event",
        500,
        { originalError: (error as Error).message },
      );
    }
  },
  {
    paramsSchema: eventParamsSchema,
  },
);

// PUT handler for updating an event
export const PUT = createApiRouteHandler<UpdateEventRequest>(
  async ({ params, body, session }): Promise<Response> => {
    if (!body) {
      throw new AppError(
        ErrorCode.INVALID_INPUT,
        "Request body is required",
        400,
      );
    }

    try {
      // Get event from database
      // Use a safer approach to find the event
      const event = await Event.findById(params.id || "");

      if (!event) {
        throw new AppError(
          ErrorCode.NOT_FOUND,
          `Event with ID ${params.id} not found`,
          404,
        );
      }

      // Check if user is the creator
      if (event.createdById !== session?.userId) {
        throw new AppError(
          ErrorCode.FORBIDDEN,
          "You don't have permission to update this event",
          403,
        );
      }

      // Validate dates if both are provided
      if (
        body.startDate &&
        body.endDate &&
        new Date(body.endDate) < new Date(body.startDate)
      ) {
        throw new AppError(
          ErrorCode.INVALID_INPUT,
          "End date cannot be before start date",
          400,
        );
      }

      // Update event - use updateOne instead of findByIdAndUpdate
      const updateData = {
        ...(body.name && { name: body.name }),
        ...(body.description !== undefined && {
          description: body.description,
        }),
        ...(body.location !== undefined && { location: body.location }),
        ...(body.startDate && { startDate: body.startDate }),
        ...(body.endDate && { endDate: body.endDate }),
        ...(body.category && { category: body.category }),
        ...(body.price !== undefined && { price: body.price }),
        ...(body.maxAttendees !== undefined && {
          maxAttendees: [body.maxAttendees.toString()],
        }),
        ...(body.image && { image: body.image }),
        ...(body.featured !== undefined && { featured: body.featured }),
        ...(body.status && { status: body.status }),
        updatedAt: new Date(),
      };

      await Event.updateOne({ _id: params.id }, updateData);
      const updatedEvent = await Event.findById(params.id || "");

      if (!updatedEvent) {
        throw new AppError(
          ErrorCode.NOT_FOUND,
          `Event with ID ${params.id} not found`,
          404,
        );
      }

      // Get attendee count
      const attendeeCount = await Attendee.countDocuments({
        eventId: params.id,
      });

      // Create response
      const response: ApiResponse<EventResponse> = {
        success: true,
        data: {
          id: updatedEvent.id,
          name: updatedEvent.name,
          description: updatedEvent.description,
          location: updatedEvent.location,
          startDate: updatedEvent.startDate,
          endDate: updatedEvent.endDate,
          category: updatedEvent.category,
          price: updatedEvent.price,
          maxAttendees: updatedEvent.maxAttendees,
          createdById: updatedEvent.createdById,
          image: updatedEvent.image,
          featured: updatedEvent.featured,
          createdAt: updatedEvent.createdAt,
          updatedAt: updatedEvent.updatedAt,
          attendeeCount,
        },
      };

      return createSuccessResponse(response);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to update event",
        500,
        { originalError: (error as Error).message },
      );
    }
  },
  {
    paramsSchema: eventParamsSchema,
    bodySchema: updateEventSchema as any,
    requireAuth: true,
  },
);

// DELETE handler for deleting an event
export const DELETE = createApiRouteHandler<void>(
  async ({ params, session }): Promise<Response> => {
    try {
      // Get event from database
      // Use a safer approach to find the event
      const event = await Event.findById(params.id || "");

      if (!event) {
        throw new AppError(
          ErrorCode.NOT_FOUND,
          `Event with ID ${params.id} not found`,
          404,
        );
      }

      // Check if user is the creator
      if (event.createdById !== session?.userId) {
        throw new AppError(
          ErrorCode.FORBIDDEN,
          "You don't have permission to delete this event",
          403,
        );
      }

      // Check if event has attendees
      const attendeeCount = await Attendee.countDocuments({
        eventId: params.id,
      });

      if (attendeeCount > 0) {
        // Instead of deleting, mark as cancelled
        // Use updateOne instead of findByIdAndUpdate
        await Event.updateOne(
          { _id: params.id },
          {
            status: "cancelled",
            updatedAt: new Date(),
          },
        );

        return createSuccessResponse({
          success: true,
          message: "Event has attendees and has been marked as cancelled",
        });
      }

      // Delete event
      // Use deleteOne instead of findByIdAndDelete
      await Event.deleteOne({ _id: params.id });

      return createSuccessResponse({
        success: true,
        message: "Event deleted successfully",
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to delete event",
        500,
        { originalError: (error as Error).message },
      );
    }
  },
  {
    paramsSchema: eventParamsSchema,
    requireAuth: true,
  },
);
