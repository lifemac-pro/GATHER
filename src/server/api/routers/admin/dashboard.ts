// server/api/routers/admin/dashboard.ts

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { Event, Attendee, Survey } from "@/server/db/models";
import { addMonths, startOfMonth, subMonths } from "date-fns";

export const adminDashboardRouter = createTRPCRouter({
  getStats: protectedProcedure.query(async () => {
    const currentMonthStart = startOfMonth(new Date());
    const nextMonthStart = addMonths(currentMonthStart, 1);
    const lastMonthStart = addMonths(currentMonthStart, -1);

    // Get total events and growth
    const totalEvents = await Event.countDocuments();

    const currentMonthEvents = await Event.countDocuments({
      startDate: {
        $gte: currentMonthStart,
        $lt: nextMonthStart,
      },
    });

    const lastMonthEvents = await Event.countDocuments({
      startDate: {
        $gte: lastMonthStart,
        $lt: currentMonthStart,
      },
    });

    // Get events by status
    const eventsByStatus = await Event.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Get events by category
    const eventsByCategory = await Event.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
    ]);

    // Get attendee stats
    const totalAttendees = await Attendee.countDocuments();

    const currentMonthAttendees = await Attendee.countDocuments({
      registeredAt: {
        $gte: currentMonthStart,
        $lt: nextMonthStart,
      },
    });

    const lastMonthAttendees = await Attendee.countDocuments({
      registeredAt: {
        $gte: lastMonthStart,
        $lt: currentMonthStart,
      },
    });

    // Get attendees by status
    const attendeesByStatus = await Attendee.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Get monthly trends (last 6 months)
    const monthlyTrends = [];
    for (let i = 0; i < 6; i++) {
      const monthStart = startOfMonth(subMonths(new Date(), i));
      const monthEnd = addMonths(monthStart, 1);

      const [monthStats] = await Promise.all([
        Event.countDocuments({
          startDate: {
            $gte: monthStart,
            $lt: monthEnd,
          },
        }),
        Attendee.countDocuments({
          registeredAt: {
            $gte: monthStart,
            $lt: monthEnd,
          },
        }),
        Survey.countDocuments({
          submittedAt: {
            $gte: monthStart,
            $lt: monthEnd,
          },
        }),
      ]);

      monthlyTrends.unshift({
        month: monthStart.toLocaleString('default', { month: 'short' }),
        events: Array.isArray(monthStats) && monthStats.length > 0 ? monthStats[0] : 0,
        attendees: Array.isArray(monthStats) && monthStats.length > 1 ? monthStats[1] : 0,
        surveys: Array.isArray(monthStats) && monthStats.length > 2 ? monthStats[2] : 0,
      });
    }

    return {
      events: {
        total: totalEvents,
        currentMonth: currentMonthEvents,
        lastMonth: lastMonthEvents,
        growth: lastMonthEvents > 0
          ? ((currentMonthEvents - lastMonthEvents) / lastMonthEvents) * 100
          : 0,
        byStatus: eventsByStatus.map(item => ({
          status: item._id,
          count: item.count,
        })),
        byCategory: eventsByCategory.map(item => ({
          category: item._id,
          count: item.count,
        })),
      },
      attendees: {
        total: totalAttendees,
        currentMonth: currentMonthAttendees,
        lastMonth: lastMonthAttendees,
        growth: lastMonthAttendees > 0
          ? ((currentMonthAttendees - lastMonthAttendees) / lastMonthAttendees) * 100
          : 0,
        byStatus: attendeesByStatus.map(item => ({
          status: item._id,
          count: item.count,
        })),
      },
      monthlyTrends,
    };
  }),
});
