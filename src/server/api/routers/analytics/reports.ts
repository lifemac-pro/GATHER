import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { Event, Attendee, Survey } from "@/server/db/models";
import { startOfDay, endOfDay, subDays } from "date-fns";

export const reportsRouter = createTRPCRouter({
  getEventReport: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
      })
    )
    .query(async ({ input }) => {
      // Get event details
      const event = await Event.findOne({ id: input.eventId });

      // Get attendance stats
      const attendanceStats = await Attendee.aggregate([
        {
          $match: { eventId: input.eventId },
        },
        {
          $group: {
            _id: null,
            totalRegistered: { $sum: 1 },
            checkedIn: {
              $sum: { $cond: [{ $ne: ["$checkedInAt", null] }, 1, 0] },
            },
            revenue: { $sum: "$paymentAmount" },
          },
        },
      ]);

      // Get demographics
      const demographics = await Attendee.aggregate([
        {
          $match: { eventId: input.eventId },
        },
        {
          $group: {
            _id: "$demographics.ageGroup",
            count: { $sum: 1 },
          },
        },
      ]);

      // Get registration timeline
      const registrationTimeline = await Attendee.aggregate([
        {
          $match: { eventId: input.eventId },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$registeredAt",
              },
            },
            count: { $sum: 1 },
          },
        },
        {
          $sort: { "_id": 1 },
        },
      ]);

      // Get survey results
      const surveyResults = await Survey.aggregate([
        {
          $match: { eventId: input.eventId },
        },
        {
          $group: {
            _id: null,
            averageRating: { $avg: "$rating" },
            totalResponses: { $sum: 1 },
            ratings: {
              $push: "$rating",
            },
          },
        },
      ]);

      // Calculate check-in rate over time
      const checkInTimeline = await Attendee.aggregate([
        {
          $match: {
            eventId: input.eventId,
            checkedInAt: { $ne: null },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d %H:00:00",
                date: "$checkedInAt",
              },
            },
            count: { $sum: 1 },
          },
        },
        {
          $sort: { "_id": 1 },
        },
      ]);

      return {
        event,
        attendance: {
          total: attendanceStats[0]?.totalRegistered || 0,
          checkedIn: attendanceStats[0]?.checkedIn || 0,
          revenue: attendanceStats[0]?.revenue || 0,
          checkInRate: attendanceStats[0]
            ? (attendanceStats[0].checkedIn / attendanceStats[0].totalRegistered) * 100
            : 0,
        },
        demographics: demographics.map((d) => ({
          ageGroup: d._id,
          count: d.count,
        })),
        registrationTimeline: registrationTimeline.map((r) => ({
          date: r._id,
          registrations: r.count,
        })),
        checkInTimeline: checkInTimeline.map((c) => ({
          datetime: c._id,
          checkIns: c.count,
        })),
        survey: surveyResults[0]
          ? {
              averageRating: surveyResults[0].averageRating,
              totalResponses: surveyResults[0].totalResponses,
              ratingDistribution: surveyResults[0].ratings.reduce(
                (acc: Record<number, number>, rating: number) => {
                  acc[rating] = (acc[rating] || 0) + 1;
                  return acc;
                },
                {}
              ),
            }
          : null,
      };
    }),

  getOrganizationReport: protectedProcedure
    .input(
      z.object({
        days: z.number().min(1).max(365).default(30),
      })
    )
    .query(async ({ input, ctx }) => {
      const startDate = startOfDay(subDays(new Date(), input.days));

      // Get event stats
      const eventStats = await Event.aggregate([
        {
          $match: {
            createdById: ctx.session.user.id,
            startDate: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: null,
            totalEvents: { $sum: 1 },
            upcomingEvents: {
              $sum: {
                $cond: [{ $gt: ["$startDate", new Date()] }, 1, 0],
              },
            },
          },
        },
      ]);

      // Get revenue stats
      const revenueStats = await Attendee.aggregate([
        {
          $match: {
            registeredAt: { $gte: startDate },
          },
        },
        {
          $lookup: {
            from: "events",
            localField: "eventId",
            foreignField: "id",
            as: "event",
          },
        },
        {
          $unwind: "$event",
        },
        {
          $match: {
            "event.createdById": ctx.session.user.id,
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$registeredAt",
              },
            },
            revenue: { $sum: "$paymentAmount" },
            registrations: { $sum: 1 },
          },
        },
        {
          $sort: { "_id": 1 },
        },
      ]);

      // Get popular event categories
      const popularCategories = await Event.aggregate([
        {
          $match: {
            createdById: ctx.session.user.id,
            startDate: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: "$category",
            eventCount: { $sum: 1 },
            totalAttendees: { $sum: "$attendeeCount" },
          },
        },
        {
          $sort: { totalAttendees: -1 },
        },
      ]);

      return {
        events: {
          total: eventStats[0]?.totalEvents || 0,
          upcoming: eventStats[0]?.upcomingEvents || 0,
        },
        revenue: revenueStats.map((r) => ({
          date: r._id,
          amount: r.revenue,
          registrations: r.registrations,
        })),
        popularCategories: popularCategories.map((c) => ({
          category: c._id,
          eventCount: c.eventCount,
          totalAttendees: c.totalAttendees,
        })),
      };
    }),
});
