import { z } from "zod";
import { createTRPCRouter, protectedProcedure, adminProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { Event, RecurringEvent } from "@/server/db/models";
import { connectToDatabase } from "@/server/db/mongo";
import { nanoid } from "nanoid";
import { addDays, addMonths, addWeeks, addYears, startOfDay, endOfDay } from "date-fns";

// Define the recurrence pattern schema
const recurrencePatternSchema = z.object({
  frequency: z.enum(["daily", "weekly", "monthly", "yearly"]),
  interval: z.number().int().min(1).default(1),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
  dayOfMonth: z.number().int().min(1).max(31).optional(),
  monthOfYear: z.number().int().min(0).max(11).optional(),
  endDate: z.date().optional(),
  count: z.number().int().min(1).optional(),
});

export const recurringEventRouter = createTRPCRouter({
  // Create a recurring event
  create: adminProcedure
    .input(z.object({
      parentEventId: z.string(),
      recurrencePattern: recurrencePatternSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        await connectToDatabase();

        // Get user ID from session
        const userId = ctx.session?.userId;
        if (!userId) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        // Check if parent event exists
        const parentEvent = await Event.findOne({ id: input.parentEventId });
        if (!parentEvent) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Parent event not found",
          });
        }

        // Check if user is authorized to create recurring events for this event
        if (parentEvent.createdById !== userId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You are not authorized to create recurring events for this event",
          });
        }

        // Check if a recurring event already exists for this parent event
        const existingRecurringEvent = await RecurringEvent.findByParentEvent(input.parentEventId);
        if (existingRecurringEvent) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "A recurring event already exists for this parent event",
          });
        }

        // Create the recurring event
        const recurringEvent = await RecurringEvent.create({
          id: nanoid(),
          parentEventId: input.parentEventId,
          recurrencePattern: input.recurrencePattern,
          excludedDates: [],
          modifiedOccurrences: [],
          createdById: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        return recurringEvent;
      } catch (error) {
        console.error("Error creating recurring event:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create recurring event",
        });
      }
    }),

  // Update a recurring event
  update: adminProcedure
    .input(z.object({
      id: z.string(),
      recurrencePattern: recurrencePatternSchema.optional(),
      excludedDates: z.array(z.date()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        await connectToDatabase();

        // Get user ID from session
        const userId = ctx.session?.userId;
        if (!userId) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        // Check if recurring event exists
        const recurringEvent = await RecurringEvent.findOne({ id: input.id });
        if (!recurringEvent) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Recurring event not found",
          });
        }

        // Check if user is authorized to update this recurring event
        if (recurringEvent.createdById !== userId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You are not authorized to update this recurring event",
          });
        }

        // Update the recurring event
        const updateData: Record<string, any> = {
          updatedAt: new Date(),
        };

        if (input.recurrencePattern) {
          updateData.recurrencePattern = input.recurrencePattern;
        }

        if (input.excludedDates) {
          updateData.excludedDates = input.excludedDates;
        }

        const updatedRecurringEvent = await RecurringEvent.findOneAndUpdate(
          { id: input.id },
          { $set: updateData },
          { new: true }
        );

        return updatedRecurringEvent;
      } catch (error) {
        console.error("Error updating recurring event:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update recurring event",
        });
      }
    }),

  // Delete a recurring event
  delete: adminProcedure
    .input(z.object({
      id: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        await connectToDatabase();

        // Get user ID from session
        const userId = ctx.session?.userId;
        if (!userId) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        // Check if recurring event exists
        const recurringEvent = await RecurringEvent.findOne({ id: input.id });
        if (!recurringEvent) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Recurring event not found",
          });
        }

        // Check if user is authorized to delete this recurring event
        if (recurringEvent.createdById !== userId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You are not authorized to delete this recurring event",
          });
        }

        // Delete the recurring event
        await RecurringEvent.deleteOne({ id: input.id });

        return { success: true };
      } catch (error) {
        console.error("Error deleting recurring event:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete recurring event",
        });
      }
    }),

  // Get a recurring event by ID
  getById: protectedProcedure
    .input(z.object({
      id: z.string(),
    }))
    .query(async ({ input }) => {
      try {
        await connectToDatabase();

        const recurringEvent = await RecurringEvent.findOne({ id: input.id });

        if (!recurringEvent) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Recurring event not found",
          });
        }

        return recurringEvent;
      } catch (error) {
        console.error("Error getting recurring event:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get recurring event",
        });
      }
    }),

  // Get a recurring event by parent event ID
  getByParentEvent: protectedProcedure
    .input(z.object({
      parentEventId: z.string(),
    }))
    .query(async ({ input }) => {
      try {
        await connectToDatabase();

        const recurringEvent = await RecurringEvent.findByParentEvent(input.parentEventId);

        return recurringEvent;
      } catch (error) {
        console.error("Error getting recurring event by parent event:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get recurring event",
        });
      }
    }),

  // Get occurrences for a recurring event
  getOccurrences: protectedProcedure
    .input(z.object({
      recurringEventId: z.string(),
      startDate: z.date(),
      endDate: z.date(),
    }))
    .query(async ({ input }) => {
      try {
        await connectToDatabase();

        const occurrences = await RecurringEvent.generateOccurrences(
          input.recurringEventId,
          input.startDate,
          input.endDate
        );

        return occurrences;
      } catch (error) {
        console.error("Error getting occurrences:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get occurrences",
        });
      }
    }),

  // Exclude a date from a recurring event
  excludeDate: adminProcedure
    .input(z.object({
      id: z.string(),
      date: z.date(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        await connectToDatabase();

        // Get user ID from session
        const userId = ctx.session?.userId;
        if (!userId) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        // Check if recurring event exists
        const recurringEvent = await RecurringEvent.findOne({ id: input.id });
        if (!recurringEvent) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Recurring event not found",
          });
        }

        // Check if user is authorized to update this recurring event
        if (recurringEvent.createdById !== userId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You are not authorized to update this recurring event",
          });
        }

        // Add the date to excluded dates if not already excluded
        const dateString = input.date.toDateString();
        const isAlreadyExcluded = recurringEvent.excludedDates.some(
          (excludedDate) => excludedDate.toDateString() === dateString
        );

        if (!isAlreadyExcluded) {
          recurringEvent.excludedDates.push(input.date);
          await recurringEvent.save();
        }

        return recurringEvent;
      } catch (error) {
        console.error("Error excluding date:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to exclude date",
        });
      }
    }),

  // Include a previously excluded date in a recurring event
  includeDate: adminProcedure
    .input(z.object({
      id: z.string(),
      date: z.date(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        await connectToDatabase();

        // Get user ID from session
        const userId = ctx.session?.userId;
        if (!userId) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        // Check if recurring event exists
        const recurringEvent = await RecurringEvent.findOne({ id: input.id });
        if (!recurringEvent) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Recurring event not found",
          });
        }

        // Check if user is authorized to update this recurring event
        if (recurringEvent.createdById !== userId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You are not authorized to update this recurring event",
          });
        }

        // Remove the date from excluded dates
        const dateString = input.date.toDateString();
        recurringEvent.excludedDates = recurringEvent.excludedDates.filter(
          (excludedDate) => excludedDate.toDateString() !== dateString
        );

        await recurringEvent.save();

        return recurringEvent;
      } catch (error) {
        console.error("Error including date:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to include date",
        });
      }
    }),

  // Modify a specific occurrence of a recurring event
  modifyOccurrence: adminProcedure
    .input(z.object({
      id: z.string(),
      date: z.date(),
      eventData: z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        location: z.string().optional(),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        await connectToDatabase();

        // Get user ID from session
        const userId = ctx.session?.userId;
        if (!userId) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        // Check if recurring event exists
        const recurringEvent = await RecurringEvent.findOne({ id: input.id });
        if (!recurringEvent) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Recurring event not found",
          });
        }

        // Check if user is authorized to update this recurring event
        if (recurringEvent.createdById !== userId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You are not authorized to update this recurring event",
          });
        }

        // Get the parent event
        const parentEvent = await Event.findOne({ id: recurringEvent.parentEventId });
        if (!parentEvent) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Parent event not found",
          });
        }

        // Check if this occurrence is already modified
        const dateString = input.date.toDateString();
        const existingModification = recurringEvent.modifiedOccurrences.find(
          (occurrence) => occurrence.date.toDateString() === dateString
        );

        if (existingModification) {
          // Update the existing modified event
          await Event.findOneAndUpdate(
            { id: existingModification.eventId },
            {
              $set: {
                ...input.eventData,
                updatedAt: new Date(),
              },
            }
          );

          return recurringEvent;
        } else {
          // Create a new event for this occurrence
          const newEvent = await Event.create({
            id: nanoid(),
            name: input.eventData.name || parentEvent.name,
            description: input.eventData.description || parentEvent.description,
            location: input.eventData.location || parentEvent.location,
            startDate: input.date,
            endDate: new Date(input.date),
            category: parentEvent.category,
            featured: parentEvent.featured,
            price: parentEvent.price,
            image: parentEvent.image,
            createdById: userId,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          // Add this occurrence to the modified occurrences
          recurringEvent.modifiedOccurrences.push({
            date: input.date,
            eventId: newEvent.id,
          });

          await recurringEvent.save();

          return recurringEvent;
        }
      } catch (error) {
        console.error("Error modifying occurrence:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to modify occurrence",
        });
      }
    }),
});
