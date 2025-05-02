import mongoose, { Schema } from "mongoose";
import { nanoid } from "nanoid";
import { connectToDatabase } from "@/server/db";

// Define the AnalyticsEvent document interface
export interface AnalyticsEventDocument extends mongoose.Document {
  id: string;
  type: string;
  category: string;
  userId?: string;
  sessionId: string;
  metadata: Record<string, any>;
  timestamp: Date;
}

// Define the AnalyticsEvent model interface
export interface AnalyticsEventModelInterface extends mongoose.Model<AnalyticsEventDocument> {
  findByUser(userId: string): Promise<AnalyticsEventDocument[]>;
  findBySession(sessionId: string): Promise<AnalyticsEventDocument[]>;
}

// Define the analytics event schema
const analyticsEventSchema = new Schema({
  id: { type: String, required: true, unique: true, default: () => nanoid() },
  type: { type: String, required: true },
  category: { type: String, required: true },
  userId: { type: String },
  sessionId: { type: String, required: true },
  metadata: { type: Schema.Types.Mixed, default: {} },
  timestamp: { type: Date, default: Date.now },
});

// Add indexes - only in non-edge environment
try {
  analyticsEventSchema.index({ id: 1 }, { unique: true });
  analyticsEventSchema.index({ userId: 1 });
  analyticsEventSchema.index({ sessionId: 1 });
  analyticsEventSchema.index({ type: 1, category: 1 });
  analyticsEventSchema.index({ timestamp: 1 });
} catch (error) {
  console.warn("Skipping index creation in edge environment");
}

// Add static methods
analyticsEventSchema.statics.findByUser = async function (userId: string) {
  return this.find({ userId }).sort({ timestamp: -1 });
};

analyticsEventSchema.statics.findBySession = async function (sessionId: string) {
  return this.find({ sessionId }).sort({ timestamp: -1 });
};

// Create a function to get the AnalyticsEvent model
const getAnalyticsEventModel = (): AnalyticsEventModelInterface => {
  // Check if we're in a middleware/edge context
  if (typeof mongoose.models === 'undefined') {
    // Return a mock model for middleware/edge context
    return {
      findOne: async () => null,
      findById: async () => null,
      find: async () => [],
      create: async () => ({}),
      updateOne: async () => ({}),
      deleteOne: async () => ({}),
      findByUser: async () => [],
      findBySession: async () => [],
    } as unknown as AnalyticsEventModelInterface;
  }

  // Return the actual model
  return (mongoose.models.AnalyticsEvent ||
    mongoose.model<AnalyticsEventDocument, AnalyticsEventModelInterface>(
      "AnalyticsEvent",
      analyticsEventSchema,
    )) as AnalyticsEventModelInterface;
};

// Export the model
export const AnalyticsEvent = getAnalyticsEventModel();

/**
 * Log an analytics event
 */
export async function logAnalyticsEvent(
  type: string,
  category: string,
  sessionId: string,
  metadata: Record<string, any> = {},
  userId?: string,
) {
  try {
    await AnalyticsEvent.create({
      type,
      category,
      userId,
      sessionId,
      metadata,
    });
  } catch (error) {
    console.error("Failed to log analytics event:", error);
  }
}

/**
 * Track an analytics event
 */
export const trackEvent = async ({
  userId,
  eventType,
  properties = {},
  request,
}: {
  userId: string;
  eventType: string;
  properties?: Record<string, any>;
  request?: Request;
}) => {
  // Ensure database connection
  await connectToDatabase();
  try {
    // Extract additional information from request if available
    let userAgent, ipAddress, referrer, path;

    if (request) {
      userAgent = request.headers.get("user-agent") || undefined;
      ipAddress = request.headers.get("x-forwarded-for") ||
                  request.headers.get("x-real-ip") || undefined;
      referrer = request.headers.get("referer") || undefined;

      // Extract path from URL
      try {
        const url = new URL(request.url);
        path = url.pathname;
      } catch (e) {
        // Ignore URL parsing errors
      }
    }

    // Create the analytics event
    await AnalyticsEvent.create({
      userId,
      eventType,
      properties,
      userAgent,
      ipAddress,
      referrer,
      path,
      createdAt: new Date(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error tracking analytics event:", error);
    return { success: false, error };
  }
};

/**
 * Get analytics data for a specific event type
 */
export const getEventTypeAnalytics = async ({
  eventType,
  startDate,
  endDate,
  groupBy = "day",
}: {
  eventType: string;
  startDate: Date;
  endDate: Date;
  groupBy?: "hour" | "day" | "week" | "month";
}) => {
  // Ensure database connection
  await connectToDatabase();
  try {
    // Define the date format for grouping
    let dateFormat;
    switch (groupBy) {
      case "hour":
        dateFormat = { year: "$year", month: "$month", day: "$dayOfMonth", hour: "$hour" };
        break;
      case "day":
        dateFormat = { year: "$year", month: "$month", day: "$dayOfMonth" };
        break;
      case "week":
        dateFormat = { year: "$year", week: "$week" };
        break;
      case "month":
        dateFormat = { year: "$year", month: "$month" };
        break;
      default:
        dateFormat = { year: "$year", month: "$month", day: "$dayOfMonth" };
    }

    // Run the aggregation
    const results = await AnalyticsEvent.aggregate([
      {
        $match: {
          eventType,
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            date: {
              $dateFromParts: dateFormat,
            },
          },
          count: { $sum: 1 },
          uniqueUsers: { $addToSet: "$userId" },
        },
      },
      {
        $project: {
          _id: 0,
          date: "$_id.date",
          count: 1,
          uniqueUsers: { $size: "$uniqueUsers" },
        },
      },
      {
        $sort: { date: 1 },
      },
    ]);

    return results;
  } catch (error) {
    console.error("Error getting analytics data:", error);
    return [];
  }
};

/**
 * Get user engagement metrics
 */
export const getUserEngagementMetrics = async ({
  startDate,
  endDate,
}: {
  startDate: Date;
  endDate: Date;
}) => {
  // Ensure database connection
  await connectToDatabase();
  try {
    // Get total active users
    const activeUsers = await AnalyticsEvent.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: "$userId",
        },
      },
      {
        $count: "count",
      },
    ]);

    // Get event views
    const eventViews = await AnalyticsEvent.countDocuments({
      eventType: "event_view",
      createdAt: { $gte: startDate, $lte: endDate },
    });

    // Get event registrations
    const eventRegistrations = await AnalyticsEvent.countDocuments({
      eventType: "event_registration",
      createdAt: { $gte: startDate, $lte: endDate },
    });

    // Get survey submissions
    const surveySubmissions = await AnalyticsEvent.countDocuments({
      eventType: "survey_submission",
      createdAt: { $gte: startDate, $lte: endDate },
    });

    // Get notification clicks
    const notificationClicks = await AnalyticsEvent.countDocuments({
      eventType: "notification_click",
      createdAt: { $gte: startDate, $lte: endDate },
    });

    return {
      activeUsers: activeUsers[0]?.count || 0,
      eventViews,
      eventRegistrations,
      surveySubmissions,
      notificationClicks,
      conversionRate: eventViews > 0 ? (eventRegistrations / eventViews) * 100 : 0,
    };
  } catch (error) {
    console.error("Error getting user engagement metrics:", error);
    return {
      activeUsers: 0,
      eventViews: 0,
      eventRegistrations: 0,
      surveySubmissions: 0,
      notificationClicks: 0,
      conversionRate: 0,
    };
  }
};
