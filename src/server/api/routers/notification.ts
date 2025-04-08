import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { Notification } from "@/server/db/models";
import { TRPCError } from "@trpc/server";

export const notificationRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        cursor: z.string().optional(),
        type: z.enum(["event", "chat", "system", "reminder"]).optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const query = Notification.find({ userId: ctx.session.user.id })
        .sort({ createdAt: -1 })
        .limit(input.limit + 1);

      if (input.cursor) {
        query.where("_id").lt(input.cursor);
      }

      if (input.type) {
        query.where("type", input.type);
      }

      const notifications = await query;
      const hasMore = notifications.length > input.limit;

      return {
        notifications: notifications.slice(0, input.limit),
        nextCursor: hasMore ? notifications[input.limit - 1]._id : undefined,
      };
    }),

  markAsRead: protectedProcedure
    .input(
      z.object({
        notificationIds: z.array(z.string()),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await Notification.updateMany(
        {
          id: { $in: input.notificationIds },
          userId: ctx.session.user.id,
        },
        {
          $set: { read: true },
        }
      );

      return { success: true };
    }),

  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    await Notification.updateMany(
      { userId: ctx.session.user.id },
      { $set: { read: true } }
    );

    return { success: true };
  }),

  delete: protectedProcedure
    .input(z.object({ notificationId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const notification = await Notification.findOneAndDelete({
        id: input.notificationId,
        userId: ctx.session.user.id,
      });

      if (!notification) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Notification not found",
        });
      }

      return { success: true };
    }),

  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const count = await Notification.countDocuments({
      userId: ctx.session.user.id,
      read: false,
    });

    return count;
  }),
});
