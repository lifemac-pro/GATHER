import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { z } from "zod";
import { attendees } from "@/server/db/schema"; // Import the attendees table

export const eventRouter = createTRPCRouter({
  register: publicProcedure
    .input(z.object({ eventId: z.number(), userId: z.number() })) // Ensure IDs are numbers
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;

      // Insert user-event registration into the attendees table
      await db.insert(attendees).values({
        userId: input.userId,
        eventId: input.eventId,
      });

      return { success: true };
    }),
});
