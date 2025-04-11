import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { collections } from "@/server/db";
import { ObjectId } from "mongodb";

export const postRouter = createTRPCRouter({
  // ✅ Simple test query
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return { greeting: `Hello ${input.text}` };
    }),

  // ✅ Create a new event
  create: publicProcedure
    .input(
      z.object({
        title: z.string(),
        description: z.string().optional(),
        date: z.date(),
        location: z.string().optional(),
        organizerId: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const result = await collections.events.insertOne({
        ...input,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return { id: result.insertedId.toString() };
    }),

  getAll: publicProcedure.query(async () => {
    const events = await collections.events.find().toArray();
    return events.map((event) => ({
      ...event,
      id: event._id.toString(),
      _id: undefined,
    }));
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const event = await collections.events.findOne({
        _id: new ObjectId(input.id),
      });
      if (!event) return null;
      return {
        ...event,
        id: event._id.toString(),
        _id: undefined,
      };
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
        date: z.date().optional(),
        location: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input;
      const result = await collections.events.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            ...updateData,
            updatedAt: new Date(),
          },
        },
      );
      return { success: result.modifiedCount > 0 };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const result = await collections.events.deleteOne({
        _id: new ObjectId(input.id),
      });
      return { success: result.deletedCount > 0 };
    }),

  // ✅ Get the latest event
  getLatestEvent: publicProcedure.query(async () => {
    try {
      // Use MongoDB methods instead of SQL-style ORM
      const event = await collections.events
        .find({})
        .sort({ createdAt: -1 })
        .limit(1)
        .toArray();

      return event[0] ?? null;
    } catch (error) {
      console.error("Error fetching latest event:", error);
      throw new Error("Failed to fetch latest event");
    }
  }),

  // ✅ Get all event registrations
  getRegistrations: publicProcedure.query(async () => {
    try {
      return await collections.attendees.find({}).toArray();
    } catch (error) {
      console.error("Error fetching registrations:", error);
      throw new Error("Failed to fetch registrations");
    }
  }),

  // ✅ Register a user for an event
  register: publicProcedure
    .input(
      z.object({
        username: z.string(),
        eventTitle: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        // 🔄 Fetch user ID from username
        const user = await collections.users.findOne({ name: input.username });

        const userId = user?._id.toString();
        if (!userId) return { success: false, message: "User not found." };

        // 🔄 Fetch event ID from event title
        const event = await collections.events.findOne({ title: input.eventTitle });

        const eventId = event?._id.toString();
        if (!eventId) return { success: false, message: "Event not found." };

        // ✅ Check if the user is already registered
        const existing = await collections.attendees.findOne({
          userId,
          eventId
        });

        if (existing) {
          return {
            success: false,
            message: "You are already registered for this event.",
          };
        }

        // ✅ Insert new registration with `userId` and `eventId`
        await collections.attendees.insertOne({
          userId,
          eventId,
          registeredAt: new Date(),
        });

        return { success: true, message: "Successfully registered!" };
      } catch (error) {
        console.error("Error registering for event:", error);
        return {
          success: false,
          message: "Registration failed. Please try again.",
        };
      }
    }),
});
