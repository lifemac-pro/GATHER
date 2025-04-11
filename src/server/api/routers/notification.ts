import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  // publicProcedure,
} from "@/server/api/trpc";
import clientPromise from "@/server/db/mongodb";
import {
  // NotificationSchema,
  NotificationCollection,
} from "@/server/db/models/notification";
import { ObjectId } from "mongodb";

export const notificationRouter = createTRPCRouter({
  // Get all notifications for the current user
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const client = await clientPromise;
    const db = client.db();

    console.log("Fetching notifications for user:", ctx.userId);

    // Get user-specific notifications and all global notifications
    const query = {
      $or: [
        { userId: ctx.userId },
        { isGlobal: true }, // Show all global notifications, even if read
      ],
    };

    console.log("Notification query:", JSON.stringify(query));

    const notifications = await db
      .collection(NotificationCollection)
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    console.log("Found notifications:", notifications.length);

    // Transform global notifications to include a read status for this user
    const transformedNotifications = notifications.map((notification) => {
      if (notification.isGlobal) {
        return {
          ...notification,
          read: notification.readBy?.includes(ctx.userId) ?? false,
        };
      }
      return notification;
    });

    console.log("Returning notifications:", transformedNotifications.length);
    return transformedNotifications;
  }),

  // Get unread notifications count
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const client = await clientPromise;
    const db = client.db();

    // Count user-specific unread notifications
    const userNotificationsCount = await db
      .collection(NotificationCollection)
      .countDocuments({ userId: ctx.userId, read: false });

    // Count global notifications not read by this user
    const globalNotificationsCount = await db
      .collection(NotificationCollection)
      .countDocuments({ isGlobal: true, readBy: { $nin: [ctx.userId] } });

    return userNotificationsCount + globalNotificationsCount;
  }),

  // Mark notification as read
  markAsRead: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const client = await clientPromise;
      const db = client.db();

      // Validate ObjectId format
      if (!ObjectId.isValid(input.id)) {
        throw new Error("Invalid notification ID format");
      }

      // Find the notification
      const notification = await db
        .collection(NotificationCollection)
        .findOne({ _id: new ObjectId(input.id) });

      if (!notification) {
        throw new Error("Notification not found");
      }

      // Handle global notifications differently
      if (notification.isGlobal) {
        // Add user to readBy array
        await db
          .collection(NotificationCollection)
          .updateOne(
            { _id: new ObjectId(input.id) },
            { $addToSet: { readBy: ctx.userId } },
          );
      } else {
        // Verify notification belongs to user for non-global notifications
        if (notification.userId !== ctx.userId) {
          throw new Error("Unauthorized to mark this notification as read");
        }

        // Mark as read
        await db
          .collection(NotificationCollection)
          .updateOne({ _id: new ObjectId(input.id) }, { $set: { read: true } });
      }

      return { success: true };
    }),

  // Mark all notifications as read
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    const client = await clientPromise;
    const db = client.db();

    // Mark all user-specific notifications as read
    await db
      .collection(NotificationCollection)
      .updateMany(
        { userId: ctx.userId, read: false },
        { $set: { read: true } },
      );

    // Add user to readBy for all global notifications
    await db
      .collection(NotificationCollection)
      .updateMany(
        { isGlobal: true, readBy: { $nin: [ctx.userId] } },
        { $addToSet: { readBy: ctx.userId } },
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

  // Admin: Create a new notification
  createNotification: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        message: z.string().min(1),
        type: z.enum([
          "EVENT_UPDATE",
          "EVENT_REMINDER",
          "SURVEY_AVAILABLE",
          "REGISTRATION_CONFIRMATION",
        ]),
        eventId: z.string().optional(),
        link: z.string().optional(),
        targetUsers: z.array(z.string()).optional(), // If empty, send as global notification
        isGlobal: z.boolean().optional().default(false),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const client = await clientPromise;
      const db = client.db();

      // If isGlobal is true or targetUsers is empty, create a global notification
      if (
        input.isGlobal ||
        !input.targetUsers ||
        input.targetUsers.length === 0
      ) {
        const globalNotification = {
          title: input.title,
          message: input.message,
          type: input.type,
          isGlobal: true,
          readBy: [],
          createdAt: new Date(),
          eventId: input.eventId,
          link: input.link,
          createdBy: ctx.userId,
        };

        const result = await db
          .collection(NotificationCollection)
          .insertOne(globalNotification);
        console.log("Created global notification:", result.insertedId);
        return { success: true, count: 1, global: true };
      }
      // If targetUsers is provided, send to specific users
      else if (input.targetUsers && input.targetUsers.length > 0) {
        const notifications = input.targetUsers.map((userId) => ({
          userId,
          title: input.title,
          message: input.message,
          type: input.type,
          read: false,
          isGlobal: false,
          createdAt: new Date(),
          eventId: input.eventId,
          link: input.link,
          createdBy: ctx.userId,
        }));

        const result = await db
          .collection(NotificationCollection)
          .insertMany(notifications);
        console.log("Created user notifications:", result.insertedCount);
        return { success: true, count: notifications.length, global: false };
      } else {
        // This should never happen due to the conditions above, but just in case
        return { success: false, error: "Invalid notification parameters" };
      }
    }),

  // Admin: Get all notifications (for admin dashboard)
  getAllNotifications: protectedProcedure.query(async (/* { ctx } */) => {
    const client = await clientPromise;
    const db = client.db();

    // Group notifications by title and message to show unique notifications
    const pipeline = [
      {
        $group: {
          _id: { title: "$title", message: "$message", type: "$type" },
          count: { $sum: 1 },
          readCount: {
            $sum: { $cond: ["$read", 1, 0] },
          },
          createdAt: { $first: "$createdAt" },
          eventId: { $first: "$eventId" },
          link: { $first: "$link" },
        },
      },
      {
        $project: {
          _id: 0,
          title: "$_id.title",
          message: "$_id.message",
          type: "$_id.type",
          count: 1,
          readCount: 1,
          unreadCount: { $subtract: ["$count", "$readCount"] },
          createdAt: 1,
          eventId: 1,
          link: 1,
        },
      },
      { $sort: { createdAt: -1 } },
    ];

    const notifications = await db
      .collection(NotificationCollection)
      .aggregate(pipeline)
      .toArray();
    return notifications;
  }),

  // Delete all notifications for the current user
  deleteAll: protectedProcedure.mutation(async ({ ctx }) => {
    const client = await clientPromise;
    const db = client.db();

    // Delete all user-specific notifications
    await db
      .collection(NotificationCollection)
      .deleteMany({ userId: ctx.userId });

    // For global notifications, just add the user to readBy
    await db
      .collection(NotificationCollection)
      .updateMany(
        { isGlobal: true, readBy: { $nin: [ctx.userId] } },
        { $addToSet: { readBy: ctx.userId } }
      );

    return { success: true };
  }),
});
