import { z } from "zod";
import { createTRPCRouter, adminProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { Event } from "@/server/db/models";
import { connectToDatabase } from "@/server/db/mongo";
import { publishEvent, unpublishEvent } from "@/lib/data-sync-service";
import { nanoid } from "nanoid";

export const adminEventRouter = createTRPCRouter({
  // Create a new event
  create: adminProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      startDate: z.date(),
      endDate: z.date(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      location: z.string().optional(),
      isVirtual: z.boolean().default(false),
      virtualMeetingInfo: z.object({
        platform: z.string().optional(),
        meetingUrl: z.string().optional(),
        meetingId: z.string().optional(),
        password: z.string().optional(),
      }).optional(),
      maxAttendees: z.number().int().positive().optional(),
      price: z.number().min(0).optional(),
      isFeatured: z.boolean().default(false),
      image: z.string().optional(),
      status: z.enum(["draft", "published", "cancelled"]).default("draft"),
      organizerId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        await connectToDatabase();

        // Create the event
        const event = await Event.create({
          ...input,
          id: nanoid(),
          createdBy: ctx.auth.userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        return event;
      } catch (error) {
        console.error("Error creating event:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create event",
        });
      }
    }),

  // Update an event
  update: adminProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      location: z.string().optional(),
      isVirtual: z.boolean().optional(),
      virtualMeetingInfo: z.object({
        platform: z.string().optional(),
        meetingUrl: z.string().optional(),
        meetingId: z.string().optional(),
        password: z.string().optional(),
      }).optional(),
      maxAttendees: z.number().int().positive().optional(),
      price: z.number().min(0).optional(),
      isFeatured: z.boolean().optional(),
      image: z.string().optional(),
      status: z.enum(["draft", "published", "cancelled"]).optional(),
      organizerId: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        await connectToDatabase();

        const { id, ...updateData } = input;

        // Check if event exists
        const existingEvent = await Event.findById(id);
        if (!existingEvent) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Event not found",
          });
        }

        // Check if status is changing to published
        const isPublishing =
          existingEvent.status !== "published" &&
          updateData.status === "published";

        // Check if status is changing from published
        const isUnpublishing =
          existingEvent.status === "published" &&
          updateData.status &&
          updateData.status !== "published";

        // Update the event
        const updatedEvent = await Event.findByIdAndUpdate(
          id,
          {
            ...updateData,
            updatedAt: new Date()
          },
          { new: true }
        );

        // Handle publishing/unpublishing
        if (isPublishing) {
          await publishEvent(id);
        } else if (isUnpublishing) {
          await unpublishEvent(id);
        }

        return updatedEvent;
      } catch (error) {
        console.error("Error updating event:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update event",
        });
      }
    }),

  // Publish an event
  publish: adminProcedure
    .input(z.object({
      id: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        const result = await publishEvent(input.id);

        if (!result.success) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to publish event",
          });
        }

        return result.event;
      } catch (error) {
        console.error("Error publishing event:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to publish event",
        });
      }
    }),

  // Unpublish an event
  unpublish: adminProcedure
    .input(z.object({
      id: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        const result = await unpublishEvent(input.id);

        if (!result.success) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to unpublish event",
          });
        }

        return result.event;
      } catch (error) {
        console.error("Error unpublishing event:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to unpublish event",
        });
      }
    }),

  // Delete an event
  delete: adminProcedure
    .input(z.object({
      id: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        await connectToDatabase();

        // Check if event exists
        const existingEvent = await Event.findById(input.id);
        if (!existingEvent) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Event not found",
          });
        }

        // Delete the event
        await Event.findByIdAndDelete(input.id);

        return { success: true };
      } catch (error) {
        console.error("Error deleting event:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete event",
        });
      }
    }),

  // Get all events (for admin dashboard)
  getAll: adminProcedure
    .query(async () => {
      try {
        await connectToDatabase();

        const events = await Event.find()
          .sort({ createdAt: -1 })
          .populate('createdBy');

        return events;
      } catch (error) {
        console.error("Error getting events:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get events",
        });
      }
    }),

  // Get event by ID (for admin dashboard)
  getById: adminProcedure
    .input(z.object({
      id: z.string(),
    }))
    .query(async ({ input }) => {
      try {
        await connectToDatabase();

        const event = await Event.findById(input.id)
          .populate('createdBy')
          .populate('organizerId');

        if (!event) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Event not found",
          });
        }

        return event;
      } catch (error) {
        console.error("Error getting event:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get event",
        });
      }
    }),
});
