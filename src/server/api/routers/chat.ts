import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { Chat, Event, Notification } from "@/server/db/models";
import { TRPCError } from "@trpc/server";

export const chatRouter = createTRPCRouter({
  sendMessage: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        message: z.string(),
        type: z.enum(["text", "announcement", "system"]).default("text"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Check if event exists
      const event = await Event.findOne({ id: input.eventId });
      if (!event) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Event not found",
        });
      }

      // Create chat message
      const chat = await Chat.create({
        ...input,
        userId: ctx.session.user.id,
      });

      // Create notifications for event attendees
      await Notification.insertMany(
        event.attendees.map((attendeeId: string) => ({
          userId: attendeeId,
          title: "New Chat Message",
          message: `New message in ${event.name}`,
          type: "chat",
          eventId: event.id,
          actionUrl: `/events/${event.id}/chat`,
        }))
      );

      return chat;
    }),

  getEventMessages: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const query = Chat.find({ eventId: input.eventId })
        .sort({ createdAt: -1 })
        .limit(input.limit + 1);

      if (input.cursor) {
        query.where("_id").lt(input.cursor);
      }

      const messages = await query.populate("user", "name image");
      const hasMore = messages.length > input.limit;

      return {
        messages: messages.slice(0, input.limit),
        nextCursor: hasMore ? messages[input.limit - 1]._id : undefined,
      };
    }),

  deleteMessage: protectedProcedure
    .input(z.object({ messageId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const message = await Chat.findOneAndDelete({
        id: input.messageId,
        userId: ctx.session.user.id,
      });

      if (!message) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Message not found or you don't have permission to delete it",
        });
      }

      return { success: true };
    }),
});
