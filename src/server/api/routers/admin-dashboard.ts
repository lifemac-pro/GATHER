import { z } from "zod";
import { createTRPCRouter, adminProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { Event, Attendee, Survey } from "@/server/db/models";
import { AnalyticsEvent } from "@/lib/analytics";
import { connectToDatabase } from "@/server/db/mongo";
import { addDays, subDays, startOfDay, endOfDay } from "date-fns";

// Mock models for compatibility
const SurveyResponse = {
  countDocuments: async (p0: { surveyId: any; }) => 0,
  find: () => ({
    sort: (p0: { createdAt: number; }) => ({
      limit: (p0?: number) => ({
        populate: (p0: string) => ({
          populate: (p0: { path: string; populate: { path: string; }; }) => []
        })
      })
    })
  }),
  aggregate: async (p0: ({ $match: { createdAt: { $gte: Date; $lte: Date; }; }; $group?: undefined; $project?: undefined; $sort?: undefined; } | { $group: { _id: { year: { $year: string; }; month: { $month: string; }; day: { $dayOfMonth: string; }; }; count: { $sum: number; }; }; $match?: undefined; $project?: undefined; $sort?: undefined; } | { $project: { _id: number; date: { $dateFromParts: { year: string; month: string; day: string; }; }; count: number; }; $match?: undefined; $group?: undefined; $sort?: undefined; } | { $sort: { date: number; }; $match?: undefined; $group?: undefined; $project?: undefined; })[]) => []
};

const RegistrationForm = {
  find: () => ({
    sort: () => ({
      limit: () => []
    })
  })
};

const FormSubmission = {
  find: () => ({
    sort: () => ({
      limit: () => []
    })
  })
};

export const adminDashboardRouter = createTRPCRouter({
  // Get dashboard data for admin dashboard
  getDashboardData: adminProcedure
    .query(async () => {
      try {
        await connectToDatabase();

        // Get total counts
        const totalEvents = await Event.countDocuments();
        const activeEvents = await Event.countDocuments({ status: "published" });
        const totalAttendees = await Attendee.countDocuments();
        const checkedInAttendees = await Attendee.countDocuments({ status: "checked-in" });
        const totalSurveys = await Survey.countDocuments();
        const activeSurveys = await Survey.countDocuments({ isActive: true });
        const totalSurveyResponses = await SurveyResponse.countDocuments({
          surveyId: undefined
        });

        // Calculate response rate
        const responseRate = totalAttendees > 0
          ? Math.round((totalSurveyResponses / totalAttendees) * 100)
          : 0;

        // Get attendee status counts
        const attendeeStatusCounts = await Attendee.aggregate([
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 }
            }
          }
        ]).then(results => {
          return results.reduce((acc, { _id, count }) => {
            acc[_id] = count;
            return acc;
          }, {} as Record<string, number>);
        });

        // Get event type counts
        const eventTypeCounts = await Event.aggregate([
          {
            $group: {
              _id: "$isVirtual",
              count: { $sum: 1 }
            }
          }
        ]).then(results => {
          return {
            "in-person": results.find(r => r._id === false)?.count || 0,
            "virtual": results.find(r => r._id === true)?.count || 0
          };
        });

        // Get upcoming events (next 7 days)
        const now = new Date();
        const nextWeek = addDays(now, 7);

        const upcomingEvents = await Event.find({
          startDate: { $gte: now, $lte: nextWeek },
          status: "published"
        }).sort({ startDate: 1 }).limit(5);

        // Get registration counts for upcoming events
        const upcomingEventsWithCounts = await Promise.all(
          upcomingEvents.map(async event => {
            const registrationCount = await Attendee.countDocuments({ eventId: event._id });
            return {
              id: event._id.toString(),
              name: event.name,
              startDate: event.startDate,
              location: event.location,
              isVirtual: event.isVirtual,
              registrationCount
            };
          })
        );

        // Get recent registrations
        const recentRegistrations = await Attendee.find()
          .sort({ registeredAt: -1 })
          .limit(5)
          .populate('eventId');

        const formattedRecentRegistrations = recentRegistrations.map(reg => ({
          id: reg._id.toString(),
          attendeeName: reg.name,
          eventName: reg.eventId.name,
          status: reg.status,
          registeredAt: reg.registeredAt
        }));

        // Get survey response rates
        const activeSurveysList = await Survey.find({ isActive: true })
          .populate('eventId');

        const surveyResponseRates = await Promise.all(
          activeSurveysList.map(async survey => {
            const attendeeCount = await Attendee.countDocuments({
              eventId: survey.eventId._id,
              status: { $in: ["attended", "checked-in"] }
            });

            const responseCount = await SurveyResponse.countDocuments({
              surveyId: survey._id
            });

            const responseRate = attendeeCount > 0
              ? Math.round((responseCount / attendeeCount) * 100)
              : 0;

            return {
              id: survey._id.toString(),
              surveyTitle: survey.title,
              eventName: survey.eventId.name,
              attendeeCount,
              responseCount,
              responseRate
            };
          })
        );

        // Get recent survey responses
        const recentSurveyResponses = await SurveyResponse.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .populate('userId')
          .populate({
            path: 'surveyId',
            populate: {
              path: 'eventId'
            }
          });

        const formattedRecentSurveyResponses = recentSurveyResponses.map(response => ({
          id: response._id.toString(),
          attendeeName: response.userId.name,
          surveyTitle: response.surveyId.title,
          eventName: response.surveyId.eventId.name,
          submittedAt: response.createdAt
        }));

        return {
          totalEvents,
          activeEvents,
          totalAttendees,
          checkedInAttendees,
          totalSurveys,
          activeSurveys,
          totalSurveyResponses,
          responseRate,
          attendeeStatusCounts,
          eventTypeCounts,
          upcomingEvents: upcomingEventsWithCounts,
          recentRegistrations: formattedRecentRegistrations,
          surveyResponseRates,
          recentSurveyResponses: formattedRecentSurveyResponses
        };
      } catch (error) {
        console.error("Error getting dashboard data:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get dashboard data",
        });
      }
    }),

  // Get recent activity for admin dashboard
  getRecentActivity: adminProcedure
    .query(async () => {
      try {
        await connectToDatabase();

        // Get recent registrations
        const recentRegistrations = await Attendee.find()
          .sort({ registeredAt: -1 })
          .limit(5)
          .populate('eventId');

        // Get recent check-ins
        const recentCheckIns = await Attendee.find({ status: "checked-in" })
          .sort({ checkedInAt: -1 })
          .limit(5)
          .populate('eventId');

        // Get recent survey responses
        const recentSurveyResponses = SurveyResponse.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .populate('userId')
          .populate({
            path: 'surveyId',
            populate: {
              path: 'eventId'
            }
          });

        // Get recent events
        const recentEvents = await Event.find()
          .sort({ createdAt: -1 })
          .limit(5);

        // Combine and format all activities
        const activities = [
          ...recentRegistrations.map(reg => ({
            type: "registration",
            title: "New Registration",
            description: `${reg.name} registered for ${reg.eventId.name}`,
            timestamp: reg.registeredAt,
            entityId: reg._id.toString(),
            entityType: "attendee"
          })),
          ...recentCheckIns.map(checkin => ({
            type: "check-in",
            title: "Attendee Check-in",
            description: `${checkin.name} checked in to ${checkin.eventId.name}`,
            timestamp: checkin.checkedInAt,
            entityId: checkin._id.toString(),
            entityType: "attendee"
          })),
          ...recentSurveyResponses.map(response => ({
            type: "survey",
            title: "Survey Response",
            description: `${response.userId.name} submitted a response for ${response.surveyId.eventId.name}`,
            timestamp: response.createdAt,
            entityId: response._id.toString(),
            entityType: "survey-response"
          })),
          ...recentEvents.map(event => ({
            type: "event",
            title: "Event Created",
            description: `New event created: ${event.name}`,
            timestamp: event.createdAt,
            entityId: event._id.toString(),
            entityType: "event"
          }))
        ];

        // Sort by timestamp (newest first)
        return activities.sort((a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ).slice(0, 10);
      } catch (error) {
        console.error("Error getting recent activity:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get recent activity",
        });
      }
    }),

  // Get event stats for admin dashboard
  getEventStats: adminProcedure
    .input(z.object({
      startDate: z.date(),
      endDate: z.date(),
    }))
    .query(async ({ input }) => {
      try {
        await connectToDatabase();

        const { startDate, endDate } = input;

        // Get registration trend
        const registrationTrend = await Attendee.aggregate([
          {
            $match: {
              registeredAt: { $gte: startDate, $lte: endDate }
            }
          },
          {
            $group: {
              _id: {
                year: { $year: "$registeredAt" },
                month: { $month: "$registeredAt" },
                day: { $dayOfMonth: "$registeredAt" }
              },
              count: { $sum: 1 }
            }
          },
          {
            $project: {
              _id: 0,
              date: {
                $dateFromParts: {
                  year: "$_id.year",
                  month: "$_id.month",
                  day: "$_id.day"
                }
              },
              count: 1
            }
          },
          {
            $sort: { date: 1 }
          }
        ]);

        // Get check-in trend
        const checkInTrend = await Attendee.aggregate([
          {
            $match: {
              status: "checked-in",
              checkedInAt: { $gte: startDate, $lte: endDate }
            }
          },
          {
            $group: {
              _id: {
                year: { $year: "$checkedInAt" },
                month: { $month: "$checkedInAt" },
                day: { $dayOfMonth: "$checkedInAt" }
              },
              count: { $sum: 1 }
            }
          },
          {
            $project: {
              _id: 0,
              date: {
                $dateFromParts: {
                  year: "$_id.year",
                  month: "$_id.month",
                  day: "$_id.day"
                }
              },
              count: 1
            }
          },
          {
            $sort: { date: 1 }
          }
        ]);

        // Get event creation trend
        const eventCreationTrend = await Event.aggregate([
          {
            $match: {
              createdAt: { $gte: startDate, $lte: endDate }
            }
          },
          {
            $group: {
              _id: {
                year: { $year: "$createdAt" },
                month: { $month: "$createdAt" },
                day: { $dayOfMonth: "$createdAt" }
              },
              count: { $sum: 1 }
            }
          },
          {
            $project: {
              _id: 0,
              date: {
                $dateFromParts: {
                  year: "$_id.year",
                  month: "$_id.month",
                  day: "$_id.day"
                }
              },
              count: 1
            }
          },
          {
            $sort: { date: 1 }
          }
        ]);

        // Get survey response trend
        const surveyResponseTrend = await SurveyResponse.aggregate([
          {
            $match: {
              createdAt: { $gte: startDate, $lte: endDate }
            }
          },
          {
            $group: {
              _id: {
                year: { $year: "$createdAt" },
                month: { $month: "$createdAt" },
                day: { $dayOfMonth: "$createdAt" }
              },
              count: { $sum: 1 }
            }
          },
          {
            $project: {
              _id: 0,
              date: {
                $dateFromParts: {
                  year: "$_id.year",
                  month: "$_id.month",
                  day: "$_id.day"
                }
              },
              count: 1
            }
          },
          {
            $sort: { date: 1 }
          }
        ]);

        // Get top events by registration
        const topEventsByRegistration = await Attendee.aggregate([
          {
            $group: {
              _id: "$eventId",
              count: { $sum: 1 }
            }
          },
          {
            $sort: { count: -1 }
          },
          {
            $limit: 5
          },
          {
            $lookup: {
              from: "events",
              localField: "_id",
              foreignField: "_id",
              as: "event"
            }
          },
          {
            $unwind: "$event"
          },
          {
            $project: {
              _id: 0,
              eventId: "$_id",
              eventName: "$event.name",
              count: 1
            }
          }
        ]);

        return {
          registrationTrend,
          checkInTrend,
          eventCreationTrend,
          surveyResponseTrend,
          topEventsByRegistration
        };
      } catch (error) {
        console.error("Error getting event stats:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get event stats",
        });
      }
    }),
});
