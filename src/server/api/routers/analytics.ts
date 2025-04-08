import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { Event, Attendee } from "@/server/db/models";

export const analyticsRouter = createTRPCRouter({
  getStats: protectedProcedure.query(async () => {
    const [stats] = await Attendee.aggregate([
      {
        $group: {
          _id: null,
          totalAttendees: { $sum: 1 },
          checkedIn: {
            $sum: { $cond: [{ $ne: ["$checkedInAt", null] }, 1, 0] },
          },
        },
      },
    ]);

    const totalEvents = await Event.countDocuments();

    return {
      totalAttendees: stats?.totalAttendees || 0,
      checkedInRate: stats ? (stats.checkedIn / stats.totalAttendees) * 100 : 0,
      totalEvents,
    };
  }),

  getAttendanceData: protectedProcedure.query(async () => {
    const attendanceData = await Attendee.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    return attendanceData.map((item) => ({
      status: item._id,
      count: item.count,
    }));
  }),

  getDemographicsData: protectedProcedure.query(async () => {
    const eventCategories = await Event.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
    ]);

    return eventCategories.map((item) => ({
      category: item._id,
      count: item.count,
    }));
  }),

  getEventCategories: protectedProcedure.query(async () => {
    const categories = await Event.distinct("category");
    return categories.map((category) => ({
      name: category,
      value: category,
    }));
  }),
});
