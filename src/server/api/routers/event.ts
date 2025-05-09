import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "@/server/api/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { EventOps } from "@/server/db/operations/event-ops";
// import { isValid } from "date-fns";

// Import connectToDatabase to ensure MongoDB connection
import { connectToDatabase } from "@/server/db/mongo";
import { cache } from "@/lib/cache";

const eventInputSchema = z.object({
  name: z.string().min(1, "Event name is required"),
  description: z.string().optional().default(""),
  location: z.string().optional().default(""),
  startDate: z.date(),
  endDate: z.date(),
  maxAttendees: z.number().optional(),
  category: z.string().min(1, "Category is required"),
  price: z.number().default(0),
  image: z.string().optional().default(""),
  featured: z.boolean().optional().default(false),
});

// Schema types are used internally by the router

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
        const userId =
          ctx &&
          ctx.session &&
          typeof ctx.session === "object" &&
          "userId" in ctx.session
            ? ctx.session.userId
            : "user-id";
        console.log("User ID for event creation:", userId);

        // Create the event using direct operations
        const event = await EventOps.create({
          name: input.name,
          description: input.description || "",
          location: input.location || "",
          startDate: input.startDate,
          endDate: input.endDate,
          category: input.category,
          featured: input.featured || false,
          price: input.price || 0,
          image: input.image || "",
          createdById: String(userId),
          status: "published", // Set to published so it shows up immediately
          maxAttendees: input.maxAttendees
            ? [input.maxAttendees.toString()]
            : [],
        });

        console.log("Event created:", event.id);

        // Invalidate all event-related caches
        cache.clear(); // Clear all cache to ensure fresh data

        return event;
      } catch (error) {
        console.error("Error creating event:", error);
        console.error("Error details:", {
          name:
            error && typeof error === "object" && "name" in error
              ? error.name
              : "Unknown error",
          message:
            error && typeof error === "object" && "message" in error
              ? error.message
              : String(error),
          stack:
            error && typeof error === "object" && "stack" in error
              ? error.stack
              : "No stack trace",
        });

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to create event: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      // Try to get event from cache first
      return await cache.getOrSet(
        `event:${input.id}`,
        async () => {
          try {
            const event = await EventOps.getById(input.id);

            if (!event) {
              throw new TRPCError({ code: "NOT_FOUND" });
            }

            return event;
          } catch (error) {
            console.error("Error getting event by ID:", error);
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to retrieve event from database",
            });
          }
        },
        { ttl: 60 * 1000 },
      ); // Cache for 1 minute
    }),

  getFeatured: publicProcedure.query(async () => {
    try {
      const events = await EventOps.getFeatured();
      return events;
    } catch (error) {
      console.error("Error in getFeatured:", error);
      // Return empty array instead of throwing
      return [];
    }
  }),

  getUpcoming: publicProcedure.query(async () => {
    try {
      const events = await EventOps.getUpcoming();
      return events;
    } catch (error) {
      console.error("Error in getUpcoming:", error);
      // Return empty array instead of throwing
      return [];
    }
  }),

  getByUser: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      try {
        console.log("Executing getByUser procedure for user:", input.userId);
        let events = await EventOps.getByUser(input.userId);

        // Filter out any test events that might have been created by the system
        events = events.filter(
          (event) => !event.name.toLowerCase().includes("test event"),
        );

        console.log("Found real user events:", events.length);
        return events;
      } catch (error) {
        console.error("Error in getByUser:", error);
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
        const userId =
          ctx &&
          ctx.session &&
          typeof ctx.session === "object" &&
          "userId" in ctx.session
            ? ctx.session.userId
            : "user-id";

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
          startDate: input.startDate,
          endDate: input.endDate,
          category: input.category,
          featured: input.featured || false,
          price: input.price || 0,
          image: input.image || "",
        });

        // Invalidate all event-related caches
        cache.clear(); // Clear all cache to ensure fresh data

        return {
          success: true,
          message: "Event successfully updated",
          event: updatedEvent,
        };
      } catch (error) {
        console.error("Error updating event:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to update event: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      console.log("Executing delete procedure for event ID:", input.id);
      try {
        // Ensure MongoDB is connected
        await connectToDatabase();
        console.log("MongoDB connected for delete operation");

        // Get user ID from session
        const userId =
          ctx &&
          ctx.session &&
          typeof ctx.session === "object" &&
          "userId" in ctx.session
            ? ctx.session.userId
            : "user-id";
        console.log("User ID for delete operation:", userId);

        // Find event with error handling
        let event;
        try {
          event = await EventOps.getById(input.id);
          console.log("Event found for deletion:", event ? "Yes" : "No");
        } catch (getError) {
          console.error("Error finding event for deletion:", getError);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to retrieve event for deletion",
          });
        }

        if (!event) {
          console.log("Event not found for deletion");
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        // Check if user is authorized to delete the event
        if (event.createdById !== userId) {
          console.log(
            "User not authorized to delete event. Event creator:",
            event.createdById,
            "Current user:",
            userId,
          );
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        // Delete the event with improved error handling
        try {
          // Try to delete the event with multiple attempts
          let deleteResult = false;
          let attempts = 0;
          const maxAttempts = 3;

          while (!deleteResult && attempts < maxAttempts) {
            attempts++;
            console.log(
              `Delete attempt ${attempts} of ${maxAttempts} for event:`,
              input.id,
            );

            try {
              deleteResult = await EventOps.delete(input.id);
              console.log(
                `Event deletion attempt ${attempts} result:`,
                deleteResult,
              );
            } catch (attemptError) {
              console.error(
                `Error during delete attempt ${attempts}:`,
                attemptError,
              );
              // Wait a bit before retrying
              if (attempts < maxAttempts) {
                console.log(`Waiting before retry attempt ${attempts + 1}...`);
                await new Promise((resolve) =>
                  setTimeout(resolve, 1000 * attempts),
                );
              }
            }
          }

          if (!deleteResult) {
            console.log("All event deletion attempts returned false");
            throw new Error(`Event deletion failed after ${attempts} attempts`);
          }
        } catch (deleteError) {
          console.error("Error during event deletion:", deleteError);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to delete event from database: ${deleteError instanceof Error ? deleteError.message : String(deleteError)}`,
          });
        }

        // Invalidate all event-related caches
        try {
          console.log("Clearing cache after event deletion");
          cache.clear(); // Clear all cache to ensure fresh data
        } catch (cacheError) {
          console.error("Error clearing cache:", cacheError);
          // Continue even if cache clearing fails
        }

        console.log("Event deletion completed successfully");
        return {
          success: true,
          message: "Event successfully deleted",
        };
      } catch (error) {
        console.error("Error deleting event:", error);
        console.error("Error details:", {
          name:
            error && typeof error === "object" && "name" in error
              ? error.name
              : "Unknown error",
          message:
            error && typeof error === "object" && "message" in error
              ? error.message
              : String(error),
          stack:
            error && typeof error === "object" && "stack" in error
              ? error.stack
              : "No stack trace",
        });

        // Determine appropriate error code
        const errorCode =
          error instanceof TRPCError ? error.code : "INTERNAL_SERVER_ERROR";

        throw new TRPCError({
          code: errorCode,
          message: `Failed to delete event: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    }),

  getCategories: publicProcedure.query(async () => {
    try {
      return await EventOps.getCategories();
    } catch (error) {
      console.error("Error getting categories:", error);
      return [];
    }
  }),

  getByIdSimple: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      try {
        const event = await EventOps.getById(input.id);
        return event;
      } catch (error) {
        console.error("Error in getByIdSimple:", error);
        return null;
      }
    }),

  search: publicProcedure
    .input(
      z.object({
        search: z.string().optional(),
        category: z.string().optional(),
        location: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        minPrice: z.number().optional(),
        maxPrice: z.number().optional(),
        featured: z.boolean().optional(),
        upcoming: z.boolean().optional(),
      }),
    )
    .query(async ({ input }) => {
      try {
        // Ensure MongoDB is connected
        await connectToDatabase();

        // Get all events first
        let events = await EventOps.getAll();

        // Apply filters
        if (events.length > 0) {
          // Filter by search term (name and description)
          if (input.search) {
            const searchTerm = input.search.toLowerCase();
            events = events.filter(
              (event) =>
                event.name.toLowerCase().includes(searchTerm) ||
                (event.description?.toLowerCase().includes(searchTerm)),
            );
          }

          // Filter by category
          if (input.category) {
            events = events.filter(
              (event) => event.category === input.category,
            );
          }

          // Filter by location
          if (input.location) {
            const locationTerm = input.location.toLowerCase();
            events = events.filter(
              (event) =>
                event.location?.toLowerCase().includes(locationTerm),
            );
          }

          // Filter by date range
          if (input.startDate) {
            const startDate = new Date(input.startDate);
            events = events.filter(
              (event) => new Date(event.endDate) >= startDate,
            );
          }

          if (input.endDate) {
            const endDate = new Date(input.endDate);
            events = events.filter(
              (event) => new Date(event.startDate) <= endDate,
            );
          }

          // Filter by price range
          if (input.minPrice !== undefined) {
            events = events.filter((event) => (event.price ?? 0) >= input.minPrice!);
          }

          if (input.maxPrice !== undefined) {
            events = events.filter((event) => (event.price ?? 0) <= input.maxPrice!);
          }

          // Filter by featured
          if (input.featured) {
            events = events.filter((event) => event.featured);
          }

          // Filter by upcoming
          if (input.upcoming) {
            const now = new Date();
            events = events.filter((event) => new Date(event.endDate) >= now);
          }
        }

        return events;
      } catch (error) {
        console.error("Error searching events:", error);
        return [];
      }
    }),

  getAll: publicProcedure.query(async () => {
    try {
      // Ensure MongoDB is connected
      await connectToDatabase();

      // Get all real events with better error handling
      let events: Array<Record<string, unknown>> = [];
      try {
        events = await EventOps.getAll();
      } catch (getAllError) {
        console.error("Error in EventOps.getAll:", getAllError);
        // Continue with empty events array
      }

      return events;
    } catch (error) {
      console.error("Error getting all events:", error);
      console.error("Error details:", {
        name:
          error && typeof error === "object" && "name" in error
            ? error.name
            : "Unknown error",
        message:
          error && typeof error === "object" && "message" in error
            ? error.message
            : String(error),
        stack:
          error && typeof error === "object" && "stack" in error
            ? error.stack
            : "No stack trace",
      });

      // Return empty array if there's an error
      console.log("Returning empty events array due to error");
      return [];
    }
  }),
});
