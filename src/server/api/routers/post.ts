import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { users, events, attendees } from "@/server/db/schema";
import { and, eq, desc } from "drizzle-orm";

export const postRouter = createTRPCRouter({
  // ✅ Simple test query
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return { greeting: `Hello ${input.text}` };
    }),

  // ✅ Create a new event
  createEvent: publicProcedure
    .input(
      z.object({
        title: z.string().min(1),
        date: z.string().min(1), // ✅ Ensure `date` is provided
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.db.insert(events).values({
          title: input.title,
          date: new Date(input.date).toISOString(), // ✅ Convert `date` correctly
          createdAt: new Date(),
        });

        return { success: true, message: "Event created successfully!" };
      } catch (error) {
        console.error("Error creating event:", error);
        return { success: false, message: "Failed to create event." };
      }
    }),

  // ✅ Get the latest event
  getLatestEvent: publicProcedure.query(async ({ ctx }) => {
    try {
      const event = await ctx.db
        .select()
        .from(events)
        .orderBy(desc(events.createdAt))
        .limit(1);

      return event[0] ?? null;
    } catch (error) {
      console.error("Error fetching latest event:", error);
      throw new Error("Failed to fetch latest event");
    }
  }),

  // ✅ Get all event registrations
  getRegistrations: publicProcedure.query(async ({ ctx }) => {
    try {
      return await ctx.db.select().from(attendees);
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
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // 🔄 Fetch user ID from username
        const user = await ctx.db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.name, input.username))
          .limit(1);

        const userId = user[0]?.id;
        if (!userId) return { success: false, message: "User not found." };

        // 🔄 Fetch event ID from event title
        const event = await ctx.db
          .select({ id: events.id })
          .from(events)
          .where(eq(events.title, input.eventTitle))
          .limit(1);

        const eventId = event[0]?.id;
        if (!eventId) return { success: false, message: "Event not found." };

        // ✅ Check if the user is already registered
        const existing = await ctx.db
          .select()
          .from(attendees)
          .where(and(eq(attendees.userId, userId), eq(attendees.eventId, eventId)))
          .limit(1);

        if (existing.length > 0) {
          return { success: false, message: "You are already registered for this event." };
        }

        // ✅ Insert new registration with `userId` and `eventId`
        await ctx.db.insert(attendees).values({
          userId,
          eventId,
          registeredAt: new Date(),
        });

        return { success: true, message: "Successfully registered!" };
      } catch (error) {
        console.error("Error registering for event:", error);
        return { success: false, message: "Registration failed. Please try again." };
      }
    }),
});
