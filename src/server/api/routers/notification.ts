import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { Notification, Attendee, Event } from "@/server/db/models";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { connectToDatabase } from "@/server/db/mongo";
import {
  sendEventUpdate,
  sendEventCancellation,
  sendEventReminder,
} from "@/lib/email-service";

export const notificationRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        cursor: z.string().optional(),
        type: z.enum(["event", "chat", "system", "reminder"]).optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const query = Notification.find({ userId: "user-id" }) // Would need to get from session
        .sort({ createdAt: -1 })
        .limit(input.limit + 1);

      if (input.cursor) {
        // Handle cursor pagination differently
        // query.where("_id").lt(input.cursor);
      }

      if (input.type) {
        query.where("type", input.type);
      }

      const notifications = await query;
      const hasMore = notifications.length > input.limit;

      return {
        notifications: notifications.slice(0, input.limit),
        nextCursor:
          hasMore && notifications.length > 0
            ? notifications[Math.min(notifications.length - 1, input.limit - 1)]
                ?._id
            : undefined,
      };
    }),

  markAsRead: protectedProcedure
    .input(
      z.object({
        notificationIds: z.array(z.string()),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await Notification.updateMany(
        {
          id: { $in: input.notificationIds },
          userId: "user-id", // Would need to get from session
        },
        {
          $set: { read: true },
        },
      );

      return { success: true };
    }),

  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    await Notification.updateMany(
      { userId: "user-id" }, // Would need to get from session
      { $set: { read: true } },
    );

    return { success: true };
  }),

  delete: protectedProcedure
    .input(z.object({ notificationId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const notification = await Notification.findOneAndDelete({
        id: input.notificationId,
        userId: "user-id", // Would need to get from session
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
      userId: "user-id", // Would need to get from session
      read: false,
    });

    return count;
  }),

  // Send notification to all attendees of an event
  sendToEventAttendees: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        subject: z.string(),
        message: z.string(),
        type: z.enum(["update", "cancellation", "reminder"]).default("update"),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Ensure MongoDB is connected
      await connectToDatabase();

      // Get user ID from session
      const userId =
        ctx &&
        ctx.session &&
        typeof ctx.session === "object" &&
        "userId" in ctx.session
          ? ctx.session.userId
          : undefined;
      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        // Get event details
        const event = await Event.findOne({ id: input.eventId });
        if (!event) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Event not found",
          });
        }

        // Check if user is authorized to send notifications for this event
        if (event.createdById !== userId) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message:
              "You are not authorized to send notifications for this event",
          });
        }

        // Get all attendees for this event
        const attendees = await Attendee.find({
          eventId: input.eventId,
          status: { $ne: "cancelled" }, // Don't send to cancelled registrations
        });

        if (!attendees || attendees.length === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "No attendees found for this event",
          });
        }

        // Create notification record
        const notification = await Notification.create({
          id: nanoid(),
          eventId: input.eventId,
          subject: input.subject,
          message: input.message,
          type: input.type,
          sentBy: userId,
          sentAt: new Date(),
          recipientCount: attendees.length,
        });

        // Send emails to all attendees
        const emailPromises = attendees.map(async (attendee) => {
          try {
            if (!attendee.email)
              return {
                success: false,
                attendeeId: attendee.id,
                error: "No email address",
              };

            let emailResult;

            // Send different email templates based on notification type
            switch (input.type) {
              case "update":
                emailResult = await sendEventUpdate({
                  email: attendee.email,
                  eventName: event.name,
                  attendeeName: attendee.name,
                  updateMessage: input.message,
                  eventUrl: `${process.env.NEXTAUTH_URL}/events/${event.id}`,
                });
                break;

              case "cancellation":
                emailResult = await sendEventCancellation({
                  email: attendee.email,
                  eventName: event.name,
                  eventDate: event.startDate,
                  attendeeName: attendee.name,
                  cancellationReason: input.message,
                });
                break;

              case "reminder":
                // Calculate hours until event
                const now = new Date();
                const eventDate = new Date(event.startDate);
                const hoursUntilEvent = Math.max(
                  0,
                  Math.round(
                    (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60),
                  ),
                );

                emailResult = await sendEventReminder({
                  email: attendee.email,
                  eventName: event.name,
                  eventDate: event.startDate,
                  eventLocation: event.location || "TBD",
                  attendeeName: attendee.name,
                  ticketCode: attendee.ticketCode,
                  eventUrl: `${process.env.NEXTAUTH_URL}/events/${event.id}`,
                  hoursUntilEvent,
                });
                break;
            }

            return {
              success: true,
              attendeeId: attendee.id,
              email: attendee.email,
            };
          } catch (error) {
            console.error(`Failed to send email to ${attendee.email}:`, error);
            return {
              success: false,
              attendeeId: attendee.id,
              email: attendee.email,
              error: error instanceof Error ? error.message : "Unknown error",
            };
          }
        });

        // Wait for all emails to be sent
        const emailResults = await Promise.all(emailPromises);

        // Count successful and failed emails
        const successCount = emailResults.filter((r) => r.success).length;
        const failedCount = emailResults.filter((r) => !r.success).length;

        // Update notification record with results
        notification.successCount = successCount;
        notification.failedCount = failedCount;
        await notification.save();

        return {
          success: true,
          notificationId: notification.id,
          totalRecipients: attendees.length,
          successCount,
          failedCount,
          results: emailResults,
        };
      } catch (error) {
        console.error("Error sending notifications:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send notifications",
        });
      }
    }),

  // Get notification history for an event
  getByEvent: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        limit: z.number().min(1).max(100).default(10),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ input, ctx }) => {
      // Ensure MongoDB is connected
      await connectToDatabase();

      // Get user ID from session
      const userId =
        ctx &&
        ctx.session &&
        typeof ctx.session === "object" &&
        "userId" in ctx.session
          ? ctx.session.userId
          : undefined;
      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        // Get event details
        const event = await Event.findOne({ id: input.eventId });
        if (!event) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Event not found",
          });
        }

        // Check if user is authorized to view notifications for this event
        if (event.createdById !== userId) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message:
              "You are not authorized to view notifications for this event",
          });
        }

        // Get notifications for this event
        const notifications = await Notification.find({
          eventId: input.eventId,
        })
          .sort({ sentAt: -1 })
          .skip(input.offset)
          .limit(input.limit);

        // Get total count
        const total = await Notification.countDocuments({
          eventId: input.eventId,
        });

        return {
          items: notifications.map((n) =>
            typeof n.toObject === "function" ? n.toObject() : n,
          ),
          total,
        };
      } catch (error) {
        console.error("Error getting notifications:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve notifications",
        });
      }
    }),
});
