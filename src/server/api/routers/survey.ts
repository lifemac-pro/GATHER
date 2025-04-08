import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { Survey, Event, User } from "@/server/db/models";
import { startOfMonth, addMonths, subMonths } from "date-fns";
import { nanoid } from "nanoid";
import { TRPCError } from "@trpc/server";

export const surveyRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        rating: z.number().min(1).max(5),
        feedback: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const survey = await Survey.create({
        id: nanoid(),
        ...input,
        userId: ctx.session.user.id,
        submittedAt: new Date(),
      });

      return survey;
    }),

  getAll: protectedProcedure
    .input(
      z.object({
        eventId: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      let query = Survey.find()
        .populate("event", "name")
        .populate("user", "name email")
        .sort({ submittedAt: -1 });

      if (input.eventId) {
        query = query.where("eventId", input.eventId);
      }

      return await query.exec();
    }),

  getStats: protectedProcedure.query(async () => {
    // Get monthly trends (last 6 months)
    const monthlyTrends = [];
    for (let i = 0; i < 6; i++) {
      const monthStart = startOfMonth(subMonths(new Date(), i));
      const monthEnd = addMonths(monthStart, 1);

      const [monthStats] = await Survey.aggregate([
        {
          $match: {
            submittedAt: {
              $gte: monthStart,
              $lt: monthEnd,
            },
          },
        },
        {
          $group: {
            _id: null,
            avgRating: { $avg: "$rating" },
            count: { $sum: 1 },
          },
        },
      ]).exec();

      monthlyTrends.unshift({
        month: monthStart.toLocaleString('default', { month: 'short' }),
        avgRating: monthStats?.avgRating?.toFixed(1) || 0,
        count: monthStats?.count || 0,
      });
    }

    // Get rating distribution
    const ratingDistribution = await Survey.aggregate([
      {
        $group: {
          _id: "$rating",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]).exec();

    // Get sentiment analysis
    const [sentimentStats] = await Survey.aggregate([
      {
        $group: {
          _id: null,
          positive: {
            $sum: { $cond: [{ $gte: ["$rating", 4] }, 1, 0] },
          },
          neutral: {
            $sum: { $cond: [{ $eq: ["$rating", 3] }, 1, 0] },
          },
          negative: {
            $sum: { $cond: [{ $lte: ["$rating", 2] }, 1, 0] },
          },
          total: { $sum: 1 },
        },
      },
    ]).exec();

    // Get top rated events
    const topEvents = await Survey.aggregate([
      {
        $group: {
          _id: "$eventId",
          avgRating: { $avg: "$rating" },
          responseCount: { $sum: 1 },
        },
      },
      {
        $sort: { avgRating: -1 },
      },
      {
        $limit: 5,
      },
      {
        $lookup: {
          from: "events",
          localField: "_id",
          foreignField: "id",
          as: "event",
        },
      },
      {
        $unwind: "$event",
      },
      {
        $project: {
          eventId: "$_id",
          eventName: "$event.name",
          avgRating: 1,
          responseCount: 1,
        },
      },
    ]).exec();

    return {
      monthlyTrends,
      ratingDistribution: ratingDistribution.map((item: any) => ({
        rating: item._id,
        count: item.count,
      })),
      sentiment: sentimentStats
        ? {
            positive: sentimentStats.positive,
            neutral: sentimentStats.neutral,
            negative: sentimentStats.negative,
            total: sentimentStats.total,
          }
        : {
            positive: 0,
            neutral: 0,
            negative: 0,
            total: 0,
          },
      topEvents,
    };
  }),
});
