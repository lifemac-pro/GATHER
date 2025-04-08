import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { Event, Waitlist, Notification } from "@/server/db/models";
import { TRPCError } from "@trpc/server";
import { addHours } from "date-fns";
import { nanoid } from "nanoid";

export const waitlistRouter = createTRPCRouter({
  join: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Check if event exists and is full
      const event = await Event.findOne({ id: input.eventId }).exec();
      if (!event) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Event not found",
        });
      }

      if (event.attendeeCount < event.maxAttendees) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Event is not full",
        });
      }

      // Get the last position number
      const lastEntry = await Waitlist.findOne({ eventId: input.eventId })
        .sort({ position: -1 })
        .limit(1)
        .exec();

      const position = lastEntry ? lastEntry.position + 1 : 1;

      // Add to waitlist
      const waitlistEntry = await Waitlist.create({
        eventId: input.eventId,
        userId: ctx.session.user.id,
        position,
      }).exec();

      return waitlistEntry;
    }),

  leave: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const entry = await Waitlist.findOneAndDelete({
        eventId: input.eventId,
        userId: ctx.session.user.id,
      }).exec();

      if (!entry) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Not on waitlist",
        });
      }

      // Reorder positions for remaining entries
      await Waitlist.updateMany(
        {
          eventId: input.eventId,
          position: { $gt: entry.position },
        },
        { $inc: { position: -1 } }
      ).exec();

      return { success: true };
    }),

  getPosition: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input, ctx }) => {
      const entry = await Waitlist.findOne({
        eventId: input.eventId,
        userId: ctx.session.user.id,
      }).exec();

      return entry ? entry.position : null;
    }),

  processNextInLine: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        spots: z.number().min(1).default(1),
      })
    )
    .mutation(async ({ input }) => {
      const event = await Event.findOne({ id: input.eventId }).exec();
      if (!event) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Event not found",
        });
      }

      // Find next people in line
      const waitlistEntries = await Waitlist.find({
        eventId: input.eventId,
        status: "waiting",
      })
        .sort({ position: 1 })
        .limit(input.spots)
        .exec();

      if (waitlistEntries.length === 0) {
        return { invitedCount: 0 };
      }

      // Update their status and set expiration
      const now = new Date();
      const expiresAt = addHours(now, 24);

      await Promise.all(
        waitlistEntries.map(async (entry) => {
          // Update waitlist entry
          await Waitlist.updateOne(
            { _id: entry._id },
            {
              $set: {
                status: "invited",
                invitationSentAt: now,
                invitationExpiresAt: expiresAt,
              },
            }
          ).exec();

          // Create notification
          await Notification.create({
            id: nanoid(),
            userId: entry.userId,
            title: "Waitlist Spot Available",
            message: `A spot has opened up for ${event.name}. You have 24 hours to register.`,
            type: "event",
            eventId: event.id,
            actionUrl: `/events/${event.id}`,
          }).exec();
        })
      );

      return { invitedCount: waitlistEntries.length };
    }),

  checkInvitation: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input, ctx }) => {
      const entry = await Waitlist.findOne({
        eventId: input.eventId,
        userId: ctx.session.user.id,
        status: "invited",
        invitationExpiresAt: { $gt: new Date() },
      }).exec();

      return {
        hasValidInvitation: !!entry,
        expiresAt: entry?.invitationExpiresAt,
      };
    }),

  getWaitlistStats: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input }) => {
      const stats = await Waitlist.aggregate([
        {
          $match: { eventId: input.eventId },
        },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]).exec();

      const totalCount = stats.reduce((acc: number, curr: { count: number }) => acc + curr.count, 0);

      return {
        totalCount,
        byStatus: {
          waiting: stats.find((s: { _id: string }) => s._id === "waiting")?.count || 0,
          invited: stats.find((s: { _id: string }) => s._id === "invited")?.count || 0,
          expired: stats.find((s: { _id: string }) => s._id === "expired")?.count || 0,
        },
      };
    }),
});
