import { createTRPCRouter, publicProcedure, protectedProcedure } from "@/server/api/trpc";
import { z } from "zod";
import { Context, TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { Event, Attendee } from "@/server/db/models";

// Import connectToDatabase to ensure MongoDB connection
import { connectToDatabase, mockData } from "@/server/db/mongo";

const eventInputSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  location: z.string().optional(),
  startDate: z.date(),
  endDate: z.date(),
  maxAttendees: z.number().optional(),
  category: z.string(),
  price: z.number().default(0),
});

type EventInput = z.infer<typeof eventInputSchema>;

interface EventUpdateInput {
  id: string;
  name?: string;
  description?: string;
  location?: string;
  startDate?: Date;
  endDate?: Date;
  maxAttendees?: number;
  category?: string;
  featured?: boolean;
  status?: "draft" | "published" | "cancelled" | "completed";
  price?: number;
}

export const eventRouter = createTRPCRouter({
  create: protectedProcedure
    .input(eventInputSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        // Ensure MongoDB is connected
        await connectToDatabase();

        // Get user ID from session
        const userId = ctx.session?.userId || "user-id";

        // Create a new event object
        const newEvent = {
          id: nanoid(),
          ...input,
          createdById: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
          status: "published", // Set to published so it shows up immediately
          image: input.image || "",
          maxAttendees: input.maxAttendees ? [input.maxAttendees.toString()] : [],
        };

        // Add to mock data first for fallback
        mockData.events.push(newEvent);
        console.log("Added event to mock data:", newEvent.id);

        try {
          // Try to create the event in MongoDB with a timeout
          const event = await Promise.race([
            Event.create(newEvent),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('MongoDB operation timed out')), 8000)
            )
          ]);

          console.log("Event created in MongoDB:", event.id);
          return event.toObject();
        } catch (dbError) {
          console.error("Error saving to MongoDB, using mock data:", dbError);
          // Return the mock event if MongoDB fails
          return newEvent;
        }
      } catch (error) {
        console.error("Error creating event:", error);

        // Create a new event in mock data as fallback
        const newEvent = {
          id: nanoid(),
          ...input,
          createdById: ctx.session?.userId || "user-id",
          createdAt: new Date(),
          updatedAt: new Date(),
          status: "published",
          image: input.image || "",
          maxAttendees: input.maxAttendees ? [input.maxAttendees.toString()] : [],
          attendees: [],
        };

        // Add to mock data
        mockData.events.push(newEvent);
        console.log("Added event to mock data as fallback:", newEvent.id);

        return newEvent;
      }
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      try {
        // Ensure MongoDB is connected
        await connectToDatabase();

        // Try to find event in MongoDB with a timeout
        const event = await Promise.race([
          Event.findOne({ id: input.id }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('MongoDB operation timed out')), 8000)
          )
        ]);

        if (!event) {
          // Check mock data
          const mockEvent = mockData.events.find(e => e.id === input.id);
          if (mockEvent) {
            return mockEvent;
          }
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        return event.toObject();
      } catch (error) {
        console.error("Error getting event by ID:", error);

        // Check mock data
        const mockEvent = mockData.events.find(e => e.id === input.id);
        if (mockEvent) {
          return mockEvent;
        }

        throw new TRPCError({ code: "NOT_FOUND" });
      }
    }),

  getFeatured: publicProcedure.query(async () => {
    try {
      // Ensure MongoDB is connected
      await connectToDatabase();

      console.log('Executing getFeatured procedure');
      // Get featured events from MongoDB
      const events = await Event.find({ featured: true, status: "published" });
      console.log('Found featured events:', events.length);
      return events.map(e => e.toObject());
    } catch (error) {
      console.error('Error in getFeatured:', error);
      throw error;
    }
  }),

  getUpcoming: publicProcedure.query(async () => {
    // Ensure MongoDB is connected
    await connectToDatabase();

    // Get upcoming events from MongoDB
    const now = new Date();
    const events = await Event.find({
      status: "published",
      startDate: { $gt: now }
    }).sort({ startDate: 1 }); // Sort by startDate ascending

    return events.map(e => e.toObject());
  }),

  getByUser: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      // Ensure MongoDB is connected
      await connectToDatabase();

      // Get events created by the user from MongoDB
      const events = await Event.find({ createdById: input.userId });
      return events.map(e => e.toObject());
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        ...eventInputSchema.shape
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Ensure MongoDB is connected
      await connectToDatabase();

      // Find event in MongoDB
      const event = await Event.findOne({ id: input.id });
      if (!event) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Get user ID from session
      const userId = ctx.session?.userId || "user-id";

      // Check if user is the creator
      if (event.createdById !== userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      // Update the event in MongoDB
      const updatedEvent = await Event.findOneAndUpdate(
        { id: input.id },
        {
          ...input,
          updatedAt: new Date(),
          maxAttendees: input.maxAttendees ? [input.maxAttendees.toString()] : event.maxAttendees
        },
        { new: true } // Return the updated document
      );

      return updatedEvent?.toObject();
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Ensure MongoDB is connected
      await connectToDatabase();

      // Find event in MongoDB
      const event = await Event.findOne({ id: input.id });
      if (!event) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Get user ID from session
      const userId = ctx.session?.userId || "user-id";

      // Check if user is authorized to delete the event
      if (event.createdById !== userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      // Delete the event from MongoDB
      await Event.deleteOne({ id: input.id });

      // Also delete all attendees for this event
      await Attendee.deleteMany({ eventId: input.id });

      return { success: true };
    }),

  getCategories: publicProcedure.query(async () => {
    // Ensure MongoDB is connected
    await connectToDatabase();

    // Get categories from MongoDB using aggregation
    const categories = await Event.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    return categories.map(c => ({ name: c._id, count: c.count }));
  }),

  getAll: publicProcedure.query(async () => {
    try {
      // Ensure MongoDB is connected
      await connectToDatabase();

      // Try to get events from MongoDB with a timeout
      const events = await Promise.race([
        Event.find({}),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('MongoDB operation timed out')), 8000)
        )
      ]);

      const result = events.map(e => e.toObject());

      // If we have mock data but no MongoDB data, use the mock data
      if (result.length === 0 && mockData.events.length > 0) {
        console.log("No events in MongoDB, using mock data");
        return mockData.events;
      }

      // Merge mock data with MongoDB data to ensure we have all events
      const allEvents = [...result];

      // Add any mock events that aren't in the MongoDB result
      mockData.events.forEach(mockEvent => {
        if (!allEvents.some(e => e.id === mockEvent.id)) {
          allEvents.push(mockEvent);
        }
      });

      return allEvents;
    } catch (error) {
      console.error("Error getting all events:", error);

      // Fallback to mock data
      console.log("Returning mock events data");
      return mockData.events;
    }
  }),
});
