import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import {
  Survey,
  Event,
  User,
  SurveyTemplate,
  Attendee,
} from "@/server/db/models";
import { sendSurveyInvitation } from "@/lib/whatsapp-service";
import { sendSurveyInvitationSMS } from "@/lib/sms-service";
import { startOfMonth, addMonths, subMonths } from "date-fns";
import { nanoid } from "nanoid";
import { TRPCError } from "@trpc/server";
import { connectToDatabase } from "@/server/db/mongo";

const responseSchema = z.object({
  questionId: z.string(),
  questionText: z.string(),
  answer: z.union([z.string(), z.number(), z.array(z.string())]),
});

export const surveyRouter = createTRPCRouter({
  // Submit a survey response
  submit: publicProcedure
    .input(
      z.object({
        templateId: z.string(),
        token: z.string(),
        responses: z.array(responseSchema),
        rating: z.number().min(1).max(5).optional(),
        feedback: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      // Ensure MongoDB is connected
      await connectToDatabase();

      // Validate the token
      let tokenData;
      try {
        const decoded = Buffer.from(input.token, "base64").toString("utf-8");
        tokenData = JSON.parse(decoded);
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid survey token",
        });
      }

      // Check if token is valid
      if (
        !tokenData.attendeeId ||
        !tokenData.templateId ||
        tokenData.templateId !== input.templateId
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid survey token",
        });
      }

      // Check if the template exists
      const template = await SurveyTemplate.findOne({ id: input.templateId });
      if (!template) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Survey template not found",
        });
      }

      // Check if the attendee exists
      const attendee = await Attendee.findOne({ id: tokenData.attendeeId });
      if (!attendee) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Attendee not found",
        });
      }

      // Check if a survey has already been submitted
      const existingSurvey = await Survey.findOne({
        templateId: input.templateId,
        userId: attendee.userId,
      });

      if (existingSurvey) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You have already submitted a response to this survey",
        });
      }

      // Create the survey response
      const survey = await Survey.create({
        id: nanoid(),
        templateId: input.templateId,
        eventId: template.eventId,
        userId: attendee.userId,
        responses: input.responses,
        rating: input.rating,
        feedback: input.feedback,
        submittedAt: new Date(),
      });

      return { success: true, surveyId: survey.id };
    }),

  // Legacy create method for backward compatibility
  create: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        rating: z.number().min(1).max(5),
        feedback: z.string().optional(),
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

      const survey = await Survey.create({
        id: nanoid(),
        ...input,
        userId,
        templateId: "legacy",
        responses: [],
        submittedAt: new Date(),
      });

      return survey;
    }),

  // Get survey responses for admin
  getAll: protectedProcedure
    .input(
      z.object({
        eventId: z.string().optional(),
        templateId: z.string().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      // Ensure MongoDB is connected
      await connectToDatabase();

      // Get user ID from session
      const userId = ctx.session?.userId;
      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      let query = Survey.find().sort({ submittedAt: -1 });

      if (input.eventId) {
        query = query.where("eventId", input.eventId);
      }

      if (input.templateId) {
        query = query.where("templateId", input.templateId);
      }

      const surveys = await query.exec();

      // Fetch related data
      const eventIds = [...new Set(surveys.map((s) => s.eventId))];
      const userIds = [...new Set(surveys.map((s) => s.userId))];

      const events = await Event.find({ id: { $in: eventIds } });
      const users = await User.find({ id: { $in: userIds } });

      // Enrich survey data
      const enrichedSurveys = surveys.map((survey) => {
        const event = events.find((e) => e.id === survey.eventId);
        const user = users.find((u) => u.id === survey.userId);

        return {
          ...survey.toObject(),
          event: event ? { id: event.id, name: event.name } : null,
          user: user
            ? {
                id: user.id,
                name: `${user.firstName} ${user.lastName}`.trim(),
                email: user.email,
              }
            : null,
        };
      });

      return enrichedSurveys;
    }),

  // Get survey statistics
  getStats: protectedProcedure.query(async ({ ctx }) => {
    // Ensure MongoDB is connected
    await connectToDatabase();

    // Get user ID from session
    const userId = ctx.session?.userId;
    if (!userId) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

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
        month: monthStart.toLocaleString("default", { month: "short" }),
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

  // Get survey response statistics
  getResponseStats: protectedProcedure
    .input(
      z.object({
        surveyId: z.string(),
        eventId: z.string(),
      }),
    )
    .query(async ({ input }) => {
      // Ensure MongoDB is connected
      await connectToDatabase();

      // Find the survey template
      const template = await SurveyTemplate.findOne({ id: input.surveyId });
      if (!template) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Survey template not found",
        });
      }

      // Find the event
      const event = await Event.findOne({ id: input.eventId });
      if (!event) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Event not found",
        });
      }

      // Get all attendees for this event
      const attendees = await Attendee.find({ eventId: input.eventId });
      const totalAttendees = attendees.length;

      // Get all surveys sent for this template
      const sentSurveys = await Survey.find({
        templateId: input.surveyId,
        eventId: input.eventId,
      });

      // Get all completed surveys
      const completedSurveys = await Survey.find({
        templateId: input.surveyId,
        eventId: input.eventId,
        isCompleted: true,
      });

      // Get opened but not completed surveys
      const openedSurveys = await Survey.find({
        templateId: input.surveyId,
        eventId: input.eventId,
        isOpened: true,
        isCompleted: false,
      });

      // Calculate average rating
      let avgRating = 0;
      if (completedSurveys.length > 0) {
        const totalRating = completedSurveys.reduce((sum, survey) => {
          return sum + (survey.rating || 0);
        }, 0);
        avgRating = totalRating / completedSurveys.length;
      }

      return {
        totalAttendees,
        totalSent: sentSurveys.length,
        totalResponses: completedSurveys.length,
        opened: openedSurveys.length + completedSurveys.length,
        avgRating,
      };
    }),

  // Track when a survey is opened
  trackOpen: publicProcedure
    .input(
      z.object({
        templateId: z.string(),
        attendeeId: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      // Ensure MongoDB is connected
      await connectToDatabase();

      try {
        // Find the survey
        const survey = await Survey.findOne({
          templateId: input.templateId,
          attendeeId: input.attendeeId,
        });

        if (survey) {
          // Update the survey to mark it as opened
          await Survey.updateOne(
            { _id: survey._id },
            {
              $set: {
                isOpened: true,
                openedAt: new Date(),
              }
            }
          );
        }

        return { success: true };
      } catch (error) {
        console.error("Error tracking survey open:", error);
        return { success: false };
      }
    }),

  // Share survey via WhatsApp
  shareViaWhatsApp: protectedProcedure
    .input(
      z.object({
        surveyId: z.string(),
        eventId: z.string(),
        phoneNumber: z.string(),
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

      // Find the survey template
      const template = await SurveyTemplate.findOne({ id: input.surveyId });
      if (!template) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Survey template not found",
        });
      }

      // Find the event
      const event = await Event.findOne({ id: input.eventId });
      if (!event) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Event not found",
        });
      }

      // Generate a temporary token for the survey
      // In a real implementation, you would create a proper token with an expiration
      const tempToken = Buffer.from(
        JSON.stringify({
          templateId: template.id,
          attendeeId: "manual-share", // This is a placeholder
          timestamp: new Date().toISOString(),
        }),
      ).toString("base64");

      // Create the survey URL
      const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
      const surveyUrl = `${baseUrl}/surveys/${template.id}?token=${tempToken}`;

      // Send the WhatsApp message
      const result = await sendSurveyInvitation({
        phone: input.phoneNumber,
        recipientName: "Attendee", // Generic name for manual sharing
        eventName: event.name,
        surveyUrl,
      });

      if (!result.success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send WhatsApp message",
        });
      }

      return { success: true };
    }),

  // Share survey via SMS
  shareViaSMS: protectedProcedure
    .input(
      z.object({
        surveyId: z.string(),
        eventId: z.string(),
        phoneNumber: z.string(),
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

      // Find the survey template
      const template = await SurveyTemplate.findOne({ id: input.surveyId });
      if (!template) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Survey template not found",
        });
      }

      // Find the event
      const event = await Event.findOne({ id: input.eventId });
      if (!event) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Event not found",
        });
      }

      // Generate a temporary token for the survey
      // In a real implementation, you would create a proper token with an expiration
      const tempToken = Buffer.from(
        JSON.stringify({
          templateId: template.id,
          attendeeId: "manual-share", // This is a placeholder
          timestamp: new Date().toISOString(),
        }),
      ).toString("base64");

      // Create the survey URL
      const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
      const surveyUrl = `${baseUrl}/surveys/${template.id}?token=${tempToken}`;

      // Send the SMS message
      const result = await sendSurveyInvitationSMS({
        phone: input.phoneNumber,
        recipientName: "Attendee", // Generic name for manual sharing
        eventName: event.name,
        surveyUrl,
      });

      if (!result.success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send SMS message",
        });
      }

      return { success: true };
    }),
});
