import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import clientPromise from "@/server/db/mongodb";
import { NotificationSchema, NotificationCollection } from "@/server/db/models/notification";
import { ObjectId } from "mongodb";

export const notificationRouter = createTRPCRouter({
  // Get all notifications for the current user
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const client = await clientPromise;
    const db = client.db();
    const notifications = await db
      .collection(NotificationCollection)
      .find({ userId: ctx.userId })
      .sort({ createdAt: -1 })
      .toArray();
    return notifications;
  }),

  // Get unread notifications count
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const client = await clientPromise;
    const db = client.db();
    const count = await db
      .collection(NotificationCollection)
      .countDocuments({ userId: ctx.userId, read: false });
    return count;
  }),

  // Mark notification as read
  markAsRead: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const client = await clientPromise;
      const db = client.db();
      
      // Verify notification belongs to user
      const notification = await db
        .collection(NotificationCollection)
        .findOne({ _id: new ObjectId(input.id) });
      
      if (!notification || notification.userId !== ctx.userId) {
        throw new Error("Notification not found or unauthorized");
      }

      await db
        .collection(NotificationCollection)
        .updateOne(
          { _id: new ObjectId(input.id) },
          { $set: { read: true } }
        );
      return { success: true };
    }),

  // Mark all notifications as read
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    const client = await clientPromise;
    const db = client.db();
    await db
      .collection(NotificationCollection)
      .updateMany(
        { userId: ctx.userId, read: false },
        { $set: { read: true } }
      );
    return { success: true };
  }),

  // Delete notification
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const client = await clientPromise;
      const db = client.db();
      
      // Verify notification belongs to user
      const notification = await db
        .collection(NotificationCollection)
        .findOne({ _id: new ObjectId(input.id) });
      
      if (!notification || notification.userId !== ctx.userId) {
        throw new Error("Notification not found or unauthorized");
      }

      await db
        .collection(NotificationCollection)
        .deleteOne({ _id: new ObjectId(input.id) });
      return { success: true };
    }),
}); 