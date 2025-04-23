import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { Event, Attendee } from "@/server/db/models";
import { connectToDatabase } from "@/server/db/mongo";
import { TRPCError } from "@trpc/server";
import { startOfDay, subDays, format, parseISO, isValid } from "date-fns";

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
        checkedInRate: stats
          ? (stats.checkedIn / stats.totalAttendees) * 100
          : 0,
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
          $sort: { count: -1 },
        },
      ]);

      return eventCategories.map((c) => ({ category: c._id, count: c.count }));
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
            count: { $sum: 1 },
          },
        },
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

  // Get event analytics with demographic information
  getEventAnalytics: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      try {
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

        // Ensure MongoDB is connected
        await connectToDatabase();

        // Get event details
        const event = await Event.findOne({ id: input.eventId });
        if (!event) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Event not found",
          });
        }

        // Check if user is authorized to view analytics for this event
        if (event.createdById !== userId) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "You are not authorized to view analytics for this event",
          });
        }

        // Get attendees for this event
        const attendees = await Attendee.find({ eventId: input.eventId });

        // Calculate registration trend
        const registrationTrend = calculateRegistrationTrend(
          attendees,
          input.startDate,
          input.endDate,
        );

        // Calculate check-in trend
        const checkInTrend = calculateCheckInTrend(
          attendees,
          input.startDate,
          input.endDate,
        );

        // Calculate status breakdown
        const statusBreakdown = calculateStatusBreakdown(attendees);

        // Calculate demographic data
        const demographics = await calculateDemographics(attendees);

        // Calculate revenue data
        const revenue = calculateRevenue(attendees, event);

        // Calculate conversion rate
        const conversionRate = calculateConversionRate(attendees, event);

        return {
          registrationTrend,
          checkInTrend,
          statusBreakdown,
          demographics,
          revenue,
          conversionRate,
          totalAttendees: attendees.length,
          checkedInAttendees: attendees.filter((a) => a.status === "checked-in")
            .length,
        };
      } catch (error) {
        console.error("Error getting event analytics:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve event analytics",
        });
      }
    }),

  // Get demographic data for an event
  getEventDemographics: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      try {
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

        // Ensure MongoDB is connected
        await connectToDatabase();

        // Get event details
        const event = await Event.findOne({ id: input.eventId });
        if (!event) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Event not found",
          });
        }

        // Check if user is authorized to view analytics for this event
        if (event.createdById !== userId) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message:
              "You are not authorized to view demographics for this event",
          });
        }

        // Get attendees for this event
        const attendees = await Attendee.find({ eventId: input.eventId });

        // Calculate demographic data
        const demographics = await calculateDemographics(attendees);

        return demographics;
      } catch (error) {
        console.error("Error getting event demographics:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve event demographics",
        });
      }
    }),
});

// Helper function to calculate registration trend
function calculateRegistrationTrend(
  attendees: any[],
  startDate?: Date,
  endDate?: Date,
) {
  // Create a map to store registrations by date
  const registrationsByDate = new Map();

  // Filter attendees by date range if provided
  let filteredAttendees = [...attendees];
  if (startDate && endDate) {
    filteredAttendees = filteredAttendees.filter((attendee) => {
      const regDate = new Date(attendee.registeredAt);
      return regDate >= startDate && regDate <= endDate;
    });
  }

  // Count registrations by date
  filteredAttendees.forEach((attendee) => {
    const date = format(new Date(attendee.registeredAt), "yyyy-MM-dd");
    registrationsByDate.set(date, (registrationsByDate.get(date) || 0) + 1);
  });

  // Convert map to array of objects
  const trend = Array.from(registrationsByDate.entries()).map(
    ([date, count]) => ({
      date,
      count,
    }),
  );

  // Sort by date
  trend.sort((a, b) => a.date.localeCompare(b.date));

  // Calculate cumulative count
  let cumulative = 0;
  trend.forEach((item) => {
    cumulative += item.count;
    item.cumulative = cumulative;
  });

  return trend;
}

// Helper function to calculate check-in trend
function calculateCheckInTrend(
  attendees: any[],
  startDate?: Date,
  endDate?: Date,
) {
  // Create a map to store check-ins by date
  const checkInsByDate = new Map();

  // Filter attendees by date range if provided and check-in status
  let filteredAttendees = attendees.filter(
    (attendee) => attendee.status === "checked-in" && attendee.checkedInAt,
  );
  if (startDate && endDate) {
    filteredAttendees = filteredAttendees.filter((attendee) => {
      const checkInDate = new Date(attendee.checkedInAt);
      return checkInDate >= startDate && checkInDate <= endDate;
    });
  }

  // Count check-ins by date
  filteredAttendees.forEach((attendee) => {
    if (attendee.checkedInAt) {
      const date = format(new Date(attendee.checkedInAt), "yyyy-MM-dd");
      checkInsByDate.set(date, (checkInsByDate.get(date) || 0) + 1);
    }
  });

  // Convert map to array of objects
  const trend = Array.from(checkInsByDate.entries()).map(([date, count]) => ({
    date,
    count,
  }));

  // Sort by date
  trend.sort((a, b) => a.date.localeCompare(b.date));

  // Calculate cumulative count
  let cumulative = 0;
  trend.forEach((item) => {
    cumulative += item.count;
    item.cumulative = cumulative;
  });

  return trend;
}

// Helper function to calculate status breakdown
function calculateStatusBreakdown(attendees: any[]) {
  // Count attendees by status
  const statusCounts = {
    registered: 0,
    "checked-in": 0,
    cancelled: 0,
    waitlisted: 0,
  };

  attendees.forEach((attendee) => {
    const status = attendee.status || "registered";
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });

  // Convert to array of objects
  return Object.entries(statusCounts).map(([status, count]) => ({
    status,
    count,
    percentage:
      attendees.length > 0 ? Math.round((count / attendees.length) * 100) : 0,
  }));
}

// Helper function to calculate demographics
async function calculateDemographics(attendees: any[]) {
  // Extract email domains for organization analysis
  const emailDomains = new Map();
  attendees.forEach((attendee) => {
    if (attendee.email) {
      const domain = attendee.email.split("@")[1];
      if (domain) {
        emailDomains.set(domain, (emailDomains.get(domain) || 0) + 1);
      }
    }
  });

  // Convert to array and sort by count
  const domainData = Array.from(emailDomains.entries())
    .map(([domain, count]) => ({ domain, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Top 10 domains

  // Calculate domain percentages
  domainData.forEach((item) => {
    item.percentage = Math.round((item.count / attendees.length) * 100);
  });

  // Extract location data if available
  const locations = new Map();
  attendees.forEach((attendee) => {
    if (attendee.location) {
      locations.set(
        attendee.location,
        (locations.get(attendee.location) || 0) + 1,
      );
    }
  });

  // Convert to array and sort by count
  const locationData = Array.from(locations.entries())
    .map(([location, count]) => ({ location, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Top 10 locations

  // Calculate location percentages
  locationData.forEach((item) => {
    item.percentage = Math.round((item.count / attendees.length) * 100);
  });

  // Extract registration time patterns
  const registrationHours = new Array(24).fill(0);
  const registrationDays = new Array(7).fill(0);

  attendees.forEach((attendee) => {
    if (attendee.registeredAt) {
      const date = new Date(attendee.registeredAt);
      registrationHours[date.getHours()]++;
      registrationDays[date.getDay()]++;
    }
  });

  // Format registration time data
  const hourData = registrationHours.map((count, hour) => ({
    hour,
    count,
    percentage:
      attendees.length > 0 ? Math.round((count / attendees.length) * 100) : 0,
  }));

  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const dayData = registrationDays.map((count, day) => ({
    day: dayNames[day],
    count,
    percentage:
      attendees.length > 0 ? Math.round((count / attendees.length) * 100) : 0,
  }));

  return {
    domains: domainData,
    locations: locationData,
    registrationTimes: {
      byHour: hourData,
      byDay: dayData,
    },
    totalAttendees: attendees.length,
  };
}

// Helper function to calculate revenue data
function calculateRevenue(attendees: any[], event: any) {
  const price = event.price || 0;
  const totalRevenue = price * attendees.length;

  // Calculate revenue by status
  const revenueByStatus = {
    registered:
      price * attendees.filter((a) => a.status === "registered").length,
    "checked-in":
      price * attendees.filter((a) => a.status === "checked-in").length,
    cancelled: price * attendees.filter((a) => a.status === "cancelled").length,
    waitlisted:
      price * attendees.filter((a) => a.status === "waitlisted").length,
  };

  // Calculate revenue by date
  const revenueByDate = new Map();
  attendees.forEach((attendee) => {
    const date = format(new Date(attendee.registeredAt), "yyyy-MM-dd");
    revenueByDate.set(date, (revenueByDate.get(date) || 0) + price);
  });

  // Convert to array and sort by date
  const revenueData = Array.from(revenueByDate.entries())
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    total: totalRevenue,
    byStatus: revenueByStatus,
    byDate: revenueData,
  };
}

// Helper function to calculate conversion rate
function calculateConversionRate(attendees: any[], event: any) {
  const totalRegistrations = attendees.length;
  const checkedIn = attendees.filter((a) => a.status === "checked-in").length;

  return {
    registrationToCheckIn:
      totalRegistrations > 0
        ? Math.round((checkedIn / totalRegistrations) * 100)
        : 0,
  };
}
