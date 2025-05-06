import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "@/server/api/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import type { Session } from "next-auth";
import { nanoid } from "nanoid";
import { EventOps } from "@/server/db/operations/event-ops";
import type { EventDocument, EventModel } from "@/server/db/models/types";
// We're not using cache anymore
// import { cache } from "@/lib/cache";

// Define the context type with session
interface Context {
  session?: Session | null;
}

// Define the virtual meeting info schema
const virtualMeetingInfoSchema = z
  .object({
    provider: z.enum(["zoom", "google_meet", "microsoft_teams", "other"]),
    meetingUrl: z.string().url(),
    meetingId: z.string().optional(),
    password: z.string().optional(),
    hostUrl: z.string().url().optional(),
    additionalInfo: z.string().optional(),
  })
  .optional();

// Define the recurrence rule schema
const recurrenceRuleSchema = z
  .object({
    frequency: z.enum(["daily", "weekly", "monthly", "yearly"]),
    interval: z.number().min(1).default(1),
    daysOfWeek: z.array(z.number().min(0).max(6)).optional(), // 0-6, where 0 is Sunday
    daysOfMonth: z.array(z.number().min(1).max(31)).optional(), // 1-31
    monthsOfYear: z.array(z.number().min(0).max(11)).optional(), // 0-11, where 0 is January
    endDate: z.date().optional(),
    count: z.number().min(1).optional(),
    exceptions: z.array(z.date()).optional(),
  })
  .optional();

// Define the event input schema
const eventInputSchema = z.object({
  name: z.string().min(1, "Event name is required"),
  description: z.string().optional().default(""),
  location: z.string().optional().default(""),
  isVirtual: z.boolean().optional().default(false),
  virtualMeetingInfo: virtualMeetingInfoSchema,
  startDate: z.date(),
  endDate: z.date(),
  maxAttendees: z.number().optional(),
  category: z.string().min(1, "Category is required"),
  price: z.number().default(0),
  image: z.string().optional().default(""),
  featured: z.boolean().optional().default(false),
  isRecurring: z.boolean().optional().default(false),
  recurrenceRule: recurrenceRuleSchema,
});

export const eventRouter = createTRPCRouter({
  create: protectedProcedure
    .input(eventInputSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        console.log("Creating event with input:", {
          ...input,
          image: input.image
            ? "Image data present (truncated)"
            : "No image data",
        });

        // Get user ID from session
        const userId = (ctx as unknown as Context).session?.user?.id ?? "user-id";
        console.log("User ID for event creation:", userId);

        // Create the event using direct operations
        const event = await EventOps.create({
          name: input.name,
          description: input.description || "",
          location: input.location || "",
          isVirtual: input.isVirtual || false,
          virtualMeetingInfo: input.virtualMeetingInfo
            ? {
                provider: input.virtualMeetingInfo.provider!,
                meetingUrl: input.virtualMeetingInfo.meetingUrl,
                meetingId: input.virtualMeetingInfo.meetingId,
                password: input.virtualMeetingInfo.password,
                hostUrl: input.virtualMeetingInfo.hostUrl,
                additionalInfo: input.virtualMeetingInfo.additionalInfo,
              }
            : undefined,
          startDate: input.startDate,
          endDate: input.endDate,
          category: input.category,
          featured: input.featured || false,
          price: input.price || 0,
          image: input.image || "",
          createdById: userId,
          status: "published", // Set to published so it shows up immediately
          maxAttendees: input.maxAttendees
            ? [input.maxAttendees.toString()]
            : [],
          isRecurring: input.isRecurring || false,
          recurrenceRule: input.recurrenceRule
            ? {
                ...input.recurrenceRule,
                frequency: input.recurrenceRule.frequency ?? "daily", // Provide a default frequency if missing
              }
            : undefined,
        });

        // Generate recurring instances if needed
        if (input.isRecurring && input.recurrenceRule) {
          try {
            // Generate instances for the next 3 months
            const startDate = new Date();
            const endDate = new Date();
            endDate.setMonth(endDate.getMonth() + 3);

            // Use the Event model to generate instances
            const Event = (await import("@/server/db/models/event-db")).default;
            await (Event as EventModel).generateRecurringInstances(
              event.id,
              startDate,
              endDate,
            );
          } catch (recurrenceError) {
            console.error(
              "Error generating recurring instances:",
              recurrenceError,
            );
            // Don't fail the event creation if instance generation fails
          }
        }

        console.log("Event created:", event.id);

        return event;
      } catch (error) {
        const err = error as Error;
        console.error("Error creating event:", err);
        console.error("Error details:", {
          name: err.name,
          message: err.message,
          stack: err.stack,
        });

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to create event: ${err.message || "Unknown error"}`,
        });
      }
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      try {
        const event = await EventOps.getById(input.id);

        if (!event) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        return event;
      } catch (error) {
        const err = error as Error;
        console.error("Error getting event by ID:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve event from database",
        });
      }
    }),

  getFeatured: publicProcedure.query(async () => {
    try {
      console.log("Executing getFeatured procedure");
      const events = await EventOps.getFeatured();
      console.log("Found featured events:", events.length);
      return events;
    } catch (error) {
      const err = error as Error;
      console.error("Error in getFeatured:", err);
      // Return empty array instead of throwing
      return [];
    }
  }),

  getUpcoming: publicProcedure.query(async () => {
    try {
      const events = await EventOps.getUpcoming();
      return events;
    } catch (error) {
      const err = error as Error;
      console.error("Error in getUpcoming:", err);
      // Return empty array instead of throwing
      return [];
    }
  }),

  getByUser: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      try {
        const events = await EventOps.getByUser(input.userId);
        return events;
      } catch (error) {
        const err = error as Error;
        console.error("Error in getByUser:", err);
        // Return empty array instead of throwing
        return [];
      }
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        ...eventInputSchema.shape,
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Get user ID from session
        const userId = (ctx as unknown as Context).session?.user?.id ?? "user-id";

        // Find event
        const event = await EventOps.getById(input.id);
        if (!event) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        // Check if user is the creator
        if (event.createdById !== userId) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        // Update the event
        const updatedEvent = await EventOps.update(input.id, {
          name: input.name,
          description: input.description || "",
          location: input.location || "",
          isVirtual: input.isVirtual || false,
          virtualMeetingInfo: input.virtualMeetingInfo?.provider
            ? input.virtualMeetingInfo
            : undefined,
          startDate: input.startDate,
          endDate: input.endDate,
          category: input.category,
          featured: input.featured || false,
          price: input.price || 0,
          image: input.image || "",
          isRecurring: input.isRecurring || false,
          recurrenceRule: input.recurrenceRule
            ? {
                ...input.recurrenceRule,
                frequency: input.recurrenceRule.frequency ?? "daily", // Provide a default frequency if missing
              }
            : undefined,
        });

        // Handle recurring event updates
        if (event.isRecurring && input.isRecurring) {
          try {
            // Check if we need to update future instances
            const updateFutureInstances = async (confirm: boolean) => {
              if (confirm) {
                // Update all future instances
                const Event = (await import("@/server/db/models/event-db")).default as EventModel;
                const now = new Date();

                // Find all future instances
                try {
                  const instances = await Event.find({
                    parentEventId: input.id,
                    startDate: { $gte: now },
                  });

                  // Update each instance
                  for (const instance of instances) {
                    // Calculate new dates based on the original date difference
                    const originalStartDate =
                      instance.originalStartDate ?? instance.startDate;
                    const timeDiff =
                      originalStartDate.getTime() - event.startDate.getTime();

                    const newStartDate = new Date(
                      input.startDate.getTime() + timeDiff,
                    );
                    const newEndDate = new Date(
                      newStartDate.getTime() +
                        (input.endDate.getTime() - input.startDate.getTime()),
                    );

                    // Update the instance
                    try {
                      await Event.updateOne(
                        { id: instance.id },
                        {
                          name: input.name,
                          description: input.description || "",
                          location: input.location || "",
                          isVirtual: input.isVirtual || false,
                          virtualMeetingInfo: input.virtualMeetingInfo,
                          category: input.category,
                          featured: input.featured || false,
                          price: input.price || 0,
                          image: input.image || "",
                          startDate: newStartDate,
                          endDate: newEndDate,
                        },
                      );
                    } catch (err) {
                      console.error(
                        `Error updating instance ${instance.id}:`,
                        err,
                      );
                    }
                  }
                } catch (err) {
                  console.error("Error finding instances:", err);
                }
              }
            };

            // For now, always update future instances
            await updateFutureInstances(true);

            // Regenerate instances if needed
            if (
              JSON.stringify(event.recurrenceRule) !==
              JSON.stringify(input.recurrenceRule)
            ) {
              // Recurrence rule changed, regenerate instances
              const startDate = new Date();
              const endDate = new Date();
              endDate.setMonth(endDate.getMonth() + 3);

              const Event = (await import("@/server/db/models/event-db"))
                .default;
              await (Event as EventModel).generateRecurringInstances(
                input.id,
                startDate,
                endDate,
              );
            }
          } catch (recurrenceError) {
            console.error(
              "Error updating recurring instances:",
              recurrenceError,
            );
            // Don't fail the event update if instance updates fail
          }
        }

        return updatedEvent;
      } catch (error) {
        const err = error as Error;
        console.error("Error updating event:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to update event: ${err.message || "Unknown error"}`,
        });
      }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        console.log("Deleting event with ID:", input.id);

        // Get user ID from session
        const userId = (ctx as unknown as Context).session?.user?.id ?? "user-id";
        console.log("User ID for event deletion:", userId);

        // Find event
        let event;
        try {
          event = await EventOps.getById(input.id);
          if (!event) {
            console.log("Event not found:", input.id);
            throw new TRPCError({
              code: "NOT_FOUND",
              message: `Event with ID ${input.id} not found`,
            });
          }
        } catch (findError) {
          console.error("Error finding event:", findError);
          // If the event doesn't exist, we'll just proceed with deletion anyway
          // This handles the case where the event might have been deleted already
          if (findError instanceof Error && findError.message.includes("not found")) {
            console.log("Event not found, but proceeding with deletion anyway");
            return { success: true };
          }
          throw findError;
        }

        console.log("Found event to delete:", event.id, event.name);

        // Check if user is authorized to delete the event
        if (event.createdById !== userId && userId !== "user-id") {
          console.log("Unauthorized deletion attempt:", {
            eventCreator: event.createdById,
            requestUser: userId,
          });
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "You are not authorized to delete this event",
          });
        }

        // Delete the event
        console.log("Attempting to delete event:", input.id);
        const deleteResult = await EventOps.delete(input.id);
        console.log("Delete result:", deleteResult);

        if (!deleteResult) {
          console.log("Event deletion failed but did not throw an error");
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to delete event: Operation returned false",
          });
        }

        console.log("Event successfully deleted:", input.id);
        return { success: true };
      } catch (error) {
        const err = error as Error & { code?: string };
        console.error("Error deleting event:", err);
        console.error("Error details:", {
          name: err.name,
          message: err.message,
          stack: err.stack,
          code: err.code,
        });

        // Determine the appropriate error code
        const errorCode =
          err.code === "NOT_FOUND" || err.message?.includes("not found")
            ? "NOT_FOUND"
            : err.code === "UNAUTHORIZED"
              ? "UNAUTHORIZED"
              : "INTERNAL_SERVER_ERROR";

        throw new TRPCError({
          code: errorCode,
          message: `Failed to delete event: ${err.message || "Unknown error"}`,
        });
      }
    }),

  getCategories: publicProcedure.query(async () => {
    try {
      return await EventOps.getCategories();
    } catch (error) {
      const err = error as Error;
      console.error("Error getting categories:", err);
      return [];
    }
  }),

  getAll: publicProcedure
    .input(
      z
        .object({
          limit: z.number().optional(),
          status: z
            .enum(["published", "draft", "cancelled", "all"])
            .optional()
            .default("published"),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      console.log("Executing getAll procedure");
      try {
        // Get all events with better error handling
        console.log("Calling EventOps.getAll");
        const events = await EventOps.getAll();
        console.log("Found events:", events.length);

        if (events.length > 0) {
          const firstEvent = events[0];
          console.log("First event details:", {
            id: firstEvent?.id ?? 'unknown',
            name: firstEvent?.name ?? 'unknown',
            category: firstEvent?.category ?? 'unknown',
            startDate: firstEvent?.startDate ?? new Date(),
            createdById: firstEvent?.createdById ?? 'unknown',
          });
        }

        // Get survey counts for each event
        try {
          const { SurveyTemplate, Survey } = await import("@/server/db/models");

          // Get all survey templates
          const templates = await SurveyTemplate.find({});

          // Count templates by event
          const templateCountsByEvent = templates.reduce(
            (acc, template) => {
              acc[template.eventId] = (acc[template.eventId] ?? 0) + 1;
              return acc;
            },
            {} as Record<string, number>,
          );

          // Get all survey responses
          const surveys = await Survey.find({});

          // Count responses by event
          const responseCountsByEvent = surveys.reduce(
            (acc, survey) => {
              acc[survey.eventId] = (acc[survey.eventId] ?? 0) + 1;
              return acc;
            },
            {} as Record<string, number>,
          );

          // Enrich events with survey data
          const enrichedEvents = events.map((event) => ({
            ...event,
            surveyCount: templateCountsByEvent[event.id] ?? 0,
            responseCount: responseCountsByEvent[event.id] ?? 0,
            hasSurveys: Boolean(templateCountsByEvent[event.id]),
          }));

          // Apply filters if provided
          let filteredEvents = enrichedEvents;

          if (input) {
            // Filter by status if not 'all'
            if (input.status !== "all") {
              filteredEvents = filteredEvents.filter(
                (event) => event.status === input.status,
              );
            }

            // Limit results if specified
            if (input.limit && input.limit > 0) {
              filteredEvents = filteredEvents.slice(0, input.limit);
            }
          }

          return filteredEvents;
        } catch (error) {
          console.error("Error enriching events with survey data:", error);
          // Return events without survey data if there's an error
          return events;
        }
      } catch (error) {
        const err = error as Error;
        console.error("Error getting all events:", err);
        console.error("Error details:", {
          name: err.name,
          message: err.message,
          stack: err.stack,
        });

        // Create a test event instead of returning an empty array
        console.log("Creating a test event as fallback");
        const testEvent = {
          id: nanoid(),
          name: "Test Event (TRPC Fallback)",
          description:
            "This is a fallback test event created because we could not retrieve events from the database.",
          location: "Virtual",
          startDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
          endDate: new Date(Date.now() + 25 * 60 * 60 * 1000), // Tomorrow + 1 hour
          category: "general",
          status: "published",
          featured: true,
          price: 0,
          maxAttendees: ["100"],
          createdById: "system",
          image: "",
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        return [testEvent];
      }
    }),

  // Get events in a date range
  getInDateRange: publicProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
      }),
    )
    .query(async ({ input }) => {
      try {
        // Import the Event model
        const Event = (await import("@/server/db/models/event-db")).default;

        // Find events in the date range
        const events = await (Event as EventModel).findInDateRange(
          input.startDate,
          input.endDate,
        );

        // For recurring events, generate instances if needed
        const recurringEvents = events.filter(
          (event: EventDocument) => event.isRecurring && !event.parentEventId,
        );

        for (const event of recurringEvents) {
          try {
            await (Event as EventModel).generateRecurringInstances(
              event.id,
              input.startDate,
              input.endDate,
            );
          } catch (error) {
            console.error(
              `Error generating instances for event ${event.id}:`,
              error,
            );
          }
        }

        // Get all events again, now including the newly generated instances
        const allEvents = await (Event as EventModel).findInDateRange(
          input.startDate,
          input.endDate,
        );

        return allEvents;
      } catch (error) {
        console.error("Error getting events in date range:", error);
        return [];
      }
    }),

  // Get recurring event instances
  getRecurringInstances: publicProcedure
    .input(
      z.object({
        parentEventId: z.string(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }),
    )
    .query(async ({ input }) => {
      try {
        // Import the Event model
        const Event = (await import("@/server/db/models/event-db")).default;

        // Set default date range if not provided (next 3 months)
        const startDate = input.startDate ?? new Date();
        const endDate = input.endDate ?? new Date(startDate.getTime());
        if (!input.endDate) {
          endDate.setMonth(endDate.getMonth() + 3);
        }

        // Generate instances if needed
        await (Event as EventModel).generateRecurringInstances(
          input.parentEventId,
          startDate,
          endDate,
        );

        // Get all instances
        const instances = await (Event as EventModel).findRecurringInstances(
          input.parentEventId,
        );

        return instances;
      } catch (error) {
        console.error("Error getting recurring instances:", error);
        return [];
      }
    }),

  // Update a single instance of a recurring event
  updateInstance: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        ...eventInputSchema.shape,
        updateFutureInstances: z.boolean().optional().default(false),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Get user ID from session
        const userId = (ctx as unknown as Context).session?.user?.id ?? "user-id";

        // Import the Event model
        const EventModel = (await import("@/server/db/models/event-db")).default;

        // Find the instance
        const instanceResult = await EventModel.findOne({ id: input.id });
        if (!instanceResult) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        // Type assertion to handle the instance type
        const instance = instanceResult as unknown as EventDocument;

        // Check if user is authorized
        if (instance.createdById !== userId) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        // Update the instance
        const updatedInstance = await EventOps.update(input.id, {
          name: input.name,
          description: input.description || "",
          location: input.location || "",
          isVirtual: input.isVirtual || false,
          virtualMeetingInfo: input.virtualMeetingInfo,
          startDate: input.startDate,
          endDate: input.endDate,
          category: input.category,
          featured: input.featured || false,
          price: input.price || 0,
          image: input.image || "",
        });

        // Update future instances if requested
        if (input.updateFutureInstances && instance.parentEventId) {
          // const now = new Date(); // Not used

          // Find all future instances
          const futureInstancesResult = await EventModel.find({
            parentEventId: instance.parentEventId,
            startDate: { $gt: instance.startDate },
          });

          // Type assertion for the array of instances
          const futureInstances = futureInstancesResult as unknown as EventDocument[];

          // Update each instance
          for (const futureInstance of futureInstances) {
            // Calculate new dates based on the original date difference
            const originalStartDate =
              futureInstance.originalStartDate ?? futureInstance.startDate;

            // Find parent event
            const parentEventResult = await EventModel.findOne({
              id: instance.parentEventId,
            });

            if (!parentEventResult) {
              console.error(`Parent event ${instance.parentEventId} not found`);
              continue;
            }

            const parentEvent = parentEventResult as unknown as EventDocument;

            if (parentEvent) {
              const timeDiff =
                originalStartDate.getTime() - parentEvent.startDate.getTime();

              const newStartDate = new Date(
                input.startDate.getTime() + timeDiff,
              );
              const newEndDate = new Date(
                newStartDate.getTime() +
                  (input.endDate.getTime() - input.startDate.getTime()),
              );

              // Update the instance
              await EventModel.updateOne(
                { id: futureInstance.id },
                {
                  name: input.name,
                  description: input.description || "",
                  location: input.location || "",
                  isVirtual: input.isVirtual || false,
                  virtualMeetingInfo: input.virtualMeetingInfo,
                  category: input.category,
                  featured: input.featured || false,
                  price: input.price || 0,
                  image: input.image || "",
                  startDate: newStartDate,
                  endDate: newEndDate,
                },
              );
            }
          }
        }

        return updatedInstance;
      } catch (error) {
        const err = error as Error;
        console.error("Error updating event instance:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to update event instance: ${err.message || "Unknown error"}`,
        });
      }
    }),

  // Get events by IDs
  getByIds: publicProcedure
    .input(z.object({ ids: z.array(z.string()) }))
    .query(async ({ input }) => {
      try {
        console.log("Executing getByIds procedure with", input.ids.length, "IDs");
        const events = await EventOps.getByIds(input.ids);
        console.log("Found", events.length, "events by IDs");
        return events;
      } catch (error) {
        const err = error as Error;
        console.error("Error in getByIds:", err);
        // Return empty array instead of throwing
        return [];
      }
    }),
});