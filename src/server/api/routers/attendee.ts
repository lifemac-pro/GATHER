import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/api/trpc";
import { Attendee, Event, User } from "@/server/db/models";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { startOfMonth, addMonths, subMonths, format, eachDayOfInterval } from "date-fns";
import { sendEmail, getSurveyEmailTemplate } from "@/server/email";
import { stringify } from "csv-stringify";
import { env } from "@/env.mjs";
import { type Context } from "@/server/api/trpc";

const PAGE_SIZE = 10;

interface GetAllInput {
  search?: string;
  eventId?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

interface GetStatsInput {
  startDate?: Date;
  endDate?: Date;
  eventId?: string;
}

interface BulkCheckInInput {
  ids: string[];
}

interface BulkRequestFeedbackInput {
  attendees: Array<{
    id: string;
    eventName: string;
    userEmail: string;
  }>;
}

export const attendeeRouter = createTRPCRouter({
  register: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        userId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const event = await Event.findOne({ id: input.eventId }).exec();
      if (!event) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
      }

      const existingRegistration = await Attendee.findOne({
        eventId: input.eventId,
        userId: input.userId,
      }).exec();

      if (existingRegistration) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Already registered for this event",
        });
      }

      const attendeeCount = await Attendee.countDocuments({
        eventId: input.eventId,
      }).exec();

      if (event.maxAttendees && attendeeCount >= event.maxAttendees) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Event is at capacity",
        });
      }

      const attendee = await Attendee.create({
        id: nanoid(),
        eventId: input.eventId,
        userId: input.userId,
        status: "registered",
        registeredAt: new Date(),
      });

      return attendee;
    }),

  getRegistration: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        userId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await Attendee.findOne({
        eventId: input.eventId,
        userId: input.userId,
      }).exec();
    }),

  getAll: publicProcedure
    .input(
      z.object({
        search: z.string().optional(),
        eventId: z.string().optional(),
        status: z.string().optional(),
        sortBy: z.string().optional(),
        sortOrder: z.enum(["asc", "desc"]).optional(),
        page: z.number().default(1),
        pageSize: z.number().default(PAGE_SIZE),
      })
    )
    .query(async ({ ctx, input }: { ctx: Context; input: GetAllInput }) => {
      let query = Attendee.find();

      if (input.search) {
        query = query.or([
          { "user.firstName": { $regex: input.search, $options: "i" } },
          { "user.lastName": { $regex: input.search, $options: "i" } },
          { "user.email": { $regex: input.search, $options: "i" } },
        ]);
      }

      if (input.eventId) {
        query = query.where("eventId", input.eventId);
      }

      if (input.status) {
        query = query.where("status", input.status);
      }

      // Get total count
      const totalCount = await query.countDocuments().exec();

      // Get paginated results
      let results = await query
        .skip((input.page || 1) * (input.pageSize || PAGE_SIZE))
        .limit(input.pageSize || PAGE_SIZE)
        .sort({
          [input.sortBy || "registeredAt"]: input.sortOrder === "desc" ? -1 : 1,
        })
        .populate("event")
        .populate("user")
        .exec();

      return {
        items: results,
        pagination: {
          total: totalCount,
          pageCount: Math.ceil(totalCount / (input.pageSize || PAGE_SIZE)),
          page: input.page || 1,
          pageSize: input.pageSize || PAGE_SIZE,
        },
      };
    }),

  getStats: publicProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        eventId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }: { ctx: Context; input: GetStatsInput }) => {
      // Get total attendees and current month registrations
      const totalStats = await Attendee.aggregate([
        {
          $match: {
            ...(input.eventId && { eventId: input.eventId }),
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            currentMonth: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $gte: ["$registeredAt", startOfMonth(new Date())] },
                      { $lt: ["$registeredAt", addMonths(startOfMonth(new Date()), 1)] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]).exec();

      // Get check-in rate
      const checkInStats = await Attendee.aggregate([
        {
          $match: {
            status: "registered",
            ...(input.eventId && { eventId: input.eventId }),
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            checkedIn: {
              $sum: {
                $cond: [{ $ne: ["$checkedInAt", null] }, 1, 0],
              },
            },
          },
        },
      ]).exec();

      const checkInRate =
        checkInStats[0].total > 0
          ? (checkInStats[0].checkedIn / checkInStats[0].total) * 100
          : 0;

      // Get attendees by status
      const statusDistribution = await Attendee.aggregate([
        {
          $match: {
            ...(input.eventId && { eventId: input.eventId }),
          },
        },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]).exec();

      // Get daily trends
      const dailyTrends = input.startDate && input.endDate ? await (async () => {
        const days = eachDayOfInterval({
          start: input.startDate!,
          end: input.endDate!,
        });

        const dailyStats = await Promise.all(
          days.map(async (date) => {
            const nextDay = addMonths(date, 1);
            const stats = await Attendee.aggregate([
              {
                $match: {
                  registeredAt: {
                    $gte: date,
                    $lt: nextDay,
                  },
                  ...(input.eventId && { eventId: input.eventId }),
                },
              },
              {
                $group: {
                  _id: null,
                  registrations: { $sum: 1 },
                  checkIns: {
                    $sum: {
                      $cond: [
                        {
                          $and: [
                            { $ne: ["$checkedInAt", null] },
                            { $gte: ["$checkedInAt", date] },
                            { $lt: ["$checkedInAt", nextDay] },
                          ],
                        },
                        1,
                        0,
                      ],
                    },
                  },
                  cancellations: {
                    $sum: {
                      $cond: [
                        {
                          $and: [
                            { $eq: ["$status", "cancelled"] },
                            { $gte: ["$registeredAt", date] },
                            { $lt: ["$registeredAt", nextDay] },
                          ],
                        },
                        1,
                        0,
                      ],
                    },
                  },
                },
              },
            ]).exec();

            return {
              date: format(date, "MMM d"),
              registrations: stats[0].registrations,
              checkIns: stats[0].checkIns,
              cancellations: stats[0].cancellations,
            };
          })
        );

        return dailyStats;
      })() : [];

      return {
        totalAttendees: totalStats[0].total,
        currentMonthRegistrations: totalStats[0].currentMonth,
        checkInRate,
        attendeesByStatus: Object.fromEntries(
          statusDistribution.map((item: { _id: string; count: number }) => [
            item._id,
            item.count,
          ])
        ),
        dailyTrends,
      };
    }),

  bulkCheckIn: publicProcedure
    .input(z.object({ ids: z.array(z.string()) }))
    .mutation(async ({ ctx, input }: { ctx: Context; input: BulkCheckInInput }) => {
      await Attendee.updateMany(
        { _id: { $in: input.ids } },
        { $set: { status: "attended", checkedInAt: new Date() } }
      ).exec();

      return { success: true };
    }),

  bulkRequestFeedback: publicProcedure
    .input(
      z.object({
        attendees: z.array(
          z.object({
            id: z.string(),
            eventName: z.string(),
            userEmail: z.string(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }: { ctx: Context; input: BulkRequestFeedbackInput }) => {
      const results = await Promise.all(
        input.attendees.map(async (attendee) => {
          const surveyLink = `${env.NEXT_PUBLIC_APP_URL}/survey/${attendee.id}`;
          
          const emailResult = await sendEmail({
            to: attendee.userEmail,
            subject: `Share Your Feedback - ${attendee.eventName}`,
            html: getSurveyEmailTemplate(attendee.eventName, surveyLink),
          });

          return {
            id: attendee.id,
            success: emailResult.success,
          };
        })
      );

      return {
        success: true,
        results: results.filter((r) => !r.success).map((r) => r.id),
      };
    }),

  exportToCSV: publicProcedure
    .input(
      z.object({
        eventId: z.string().optional(),
        status: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }: { ctx: Context; input: { eventId?: string; status?: string } }) => {
      let query = Attendee.find();

      if (input.eventId) {
        query = query.where("eventId", input.eventId);
      }

      if (input.status) {
        query = query.where("status", input.status);
      }

      const data = await query.populate("event").populate("user").exec();

      // Transform dates and prepare data for CSV
      const csvData = data.map((row) => ({
        "Event Name": row.event.name,
        "Attendee Name": `${row.user.firstName} ${row.user.lastName}`,
        "Email": row.user.email,
        "Status": row.status.charAt(0).toUpperCase() + row.status.slice(1),
        "Registered At": format(new Date(row.registeredAt), "MMM d, yyyy HH:mm"),
        "Checked In At": row.checkedInAt
          ? format(new Date(row.checkedInAt), "MMM d, yyyy HH:mm")
          : "-",
      }));

      // Generate CSV
      const csv = stringify(csvData, {
        header: true,
        columns: [
          "Event Name",
          "Attendee Name",
          "Email",
          "Status",
          "Registered At",
          "Checked In At",
        ],
      });

      return csv;
    }),

  checkIn: publicProcedure
    .input(
      z.object({
        attendeeId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const attendee = await Attendee.findOne({ _id: input.attendeeId }).exec();
      if (!attendee) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Attendee not found",
        });
      }

      attendee.checkedInAt = new Date();
      await attendee.save().exec();
      return attendee;
    }),

  cancel: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }: { ctx: Context; input: { id: string } }) => {
      const attendee = await Attendee.updateOne(
        { _id: input.id },
        { $set: { status: "cancelled" } }
      ).exec();

      return attendee;
    }),

  requestFeedback: publicProcedure
    .input(
      z.object({
        id: z.string(),
        eventName: z.string(),
      })
    )
    .mutation(async ({ ctx, input }: { ctx: Context; input: { id: string; eventName: string } }) => {
      // Get attendee details
      const attendee = await Attendee.findOne({ _id: input.id }).populate("user").exec();
      if (!attendee) {
        throw new Error("Attendee not found");
      }

      // Generate survey link
      const surveyLink = `${env.NEXT_PUBLIC_APP_URL}/survey/${input.id}`;

      // Send email
      const emailResult = await sendEmail({
        to: attendee.user.email,
        subject: `Share Your Feedback - ${input.eventName}`,
        html: getSurveyEmailTemplate(input.eventName, surveyLink),
      });

      if (!emailResult.success) {
        throw new Error("Failed to send feedback request email");
      }

      return { success: true };
    }),
});
