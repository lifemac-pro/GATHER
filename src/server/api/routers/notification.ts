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
import { getSocket } from "@/lib/socket";
import { sendNotification } from "@/server/socket";

export const notificationRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        cursor: z.string().optional(), // ISO timestamp string
        type: z.enum(["event", "survey", "info", "reminder"]).optional(),
      }).optional(),
    )
    .query(async ({ ctx, input }) => {
      // Ensure MongoDB is connected
      await connectToDatabase();

      // Get user ID from session
      const userId = ctx.session?.userId;
      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        const limit = input?.limit ?? 20;

        // Create base query with proper typing
        const baseQuery: {
          userId: string;
          createdAt?: { $lt: Date };
          type?: string;
        } = { userId };

        // Add cursor condition if provided
        if (input?.cursor) {
          baseQuery.createdAt = { $lt: new Date(input.cursor) };
        }

        // Add type filter if provided
        if (input?.type) {
          baseQuery.type = input.type;
        }

        // Execute query
        const notifications = await Notification.find(baseQuery)
          .sort({ createdAt: -1 })
          .limit(limit + 1);

        // Check if there are more results
        const hasMore = notifications.length > limit;

        // Return results with cursor info
        return {
          items: notifications.slice(0, limit),
          nextCursor: hasMore ? notifications[limit - 1].createdAt.toISOString() : undefined
        };
      } catch (error) {
        console.error("Error getting notifications:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get notifications",
        });
      }
    }),

  markAsRead: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Ensure MongoDB is connected
      await connectToDatabase();

      // Get user ID from session
      const userId = ctx.session?.userId;
      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        // Update notification using the id field instead of _id
        const result = await Notification.updateOne(
          {
            id: input.id,
            userId,
          },
          {
            $set: {
              read: true,
              updatedAt: new Date(),
            },
          },
        );

        if (result.modifiedCount === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Notification not found",
          });
        }

        return { success: true };
      } catch (error) {
        console.error("Error marking notification as read:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to mark notification as read",
        });
      }
    }),

  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    // Ensure MongoDB is connected
    await connectToDatabase();

    // Get user ID from session
    const userId = ctx.session?.userId;
    if (!userId) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    await Notification.updateMany(
      { userId },
      { $set: { read: true, updatedAt: new Date() } },
    );

    return { success: true };
  }),

  delete: protectedProcedure
    .input(z.object({ notificationId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Ensure MongoDB is connected
      await connectToDatabase();

      // Get user ID from session
      const userId = ctx.session?.userId;
      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const notification = await Notification.findOneAndDelete({
        id: input.notificationId,
        userId,
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
    // Ensure MongoDB is connected
    await connectToDatabase();

    // Get user ID from session
    const userId = ctx.session?.userId;
    if (!userId) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    const count = await Notification.countDocuments({
      userId,
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
        type: z.enum(["update", "cancellation", "reminder"]),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Ensure MongoDB is connected
      await connectToDatabase();

      // Get user ID from session
      const userId = ctx.session?.userId;
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

            // Send different email templates based on notification type
            switch (input.type) {
              case "update":
                await sendEventUpdate({
                  email: attendee.email,
                  eventName: event.name,
                  attendeeName: attendee.name,
                  updateMessage: input.message,
                  eventUrl: `${process.env.NEXTAUTH_URL}/events/${event.id}`,
                });
                break;

              case "cancellation":
                await sendEventCancellation({
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

                await sendEventReminder({
                  email: attendee.email,
                  eventName: event.name,
                  eventDate: event.startDate,
                  eventLocation: event.location ?? "TBD",
                  attendeeName: attendee.name,
                  ticketCode: attendee.ticketCode ?? "NO-CODE",
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
        await Notification.findOneAndUpdate(
          { id: notification.id },
          {
            $set: {
              successCount: successCount,
              failedCount: failedCount
            }
          }
        );

        return {
          success: true,
          notificationId: notification.id as string,
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
