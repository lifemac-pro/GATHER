import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { Event, Attendee } from "@/server/db/models";
import { connectToDatabase } from "@/server/db/mongo";

export const analyticsRouter = createTRPCRouter({
  getStats: protectedProcedure.query(async () => {
    // Ensure MongoDB is connected
    await connectToDatabase();

    try {
      // Get real analytics data from MongoDB
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
    } catch (error) {
      console.error("Error getting analytics stats:", error);
      // Fallback to mock data if there's an error
      return {
        totalAttendees: 0,
        checkedInRate: 0,
        totalEvents: 0,
      };
    }
  }),

  getAttendanceData: protectedProcedure.query(async () => {
    // Ensure MongoDB is connected
    await connectToDatabase();

    try {
      // Get real attendance data from MongoDB
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
    } catch (error) {
      console.error("Error getting attendance data:", error);
      // Fallback to empty data if there's an error
      return [];
    }
  }),

  getDemographicsData: protectedProcedure.query(async () => {
    // Ensure MongoDB is connected
    await connectToDatabase();

    try {
      // Get real demographics data from MongoDB
      const eventCategories = await Event.aggregate([
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 },
          },
        },
        {
          $sort: { count: -1 }
        }
      ]);

      return eventCategories.map(c => ({ category: c._id, count: c.count }));
    } catch (error) {
      console.error("Error getting demographics data:", error);
      // Fallback to empty data if there's an error
      return [];
    }
  }),

  getEventCategories: protectedProcedure.query(async () => {
    // Ensure MongoDB is connected
    await connectToDatabase();

    try {
      // Get real event categories from MongoDB
      const categories = await Event.distinct("category");

      // Get counts for each category
      const categoryCounts = await Event.aggregate([
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 }
          }
        }
      ]);

      // Create a map of category to count
      const countMap = categoryCounts.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {});

      return categories.map((category: string) => ({
        name: category,
        count: countMap[category] || 0,
      }));
    } catch (error) {
      console.error("Error getting event categories:", error);
      // Fallback to empty data if there's an error
      return [];
    }
  }),
});
