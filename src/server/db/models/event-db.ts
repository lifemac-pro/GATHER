import mongoose, { Schema } from "mongoose";
import { type EventDocument, type EventModel } from "./types";
import { isValid } from "date-fns";

// Define the virtual meeting info schema
const virtualMeetingInfoSchema = new Schema(
  {
    provider: {
      type: String,
      enum: ["zoom", "google_meet", "microsoft_teams", "other"],
      required: true,
    },
    meetingUrl: { type: String, required: true },
    meetingId: { type: String },
    password: { type: String },
    hostUrl: { type: String },
    additionalInfo: { type: String },
  },
  { _id: false },
);

// Define the recurrence rule schema
const recurrenceRuleSchema = new Schema(
  {
    frequency: {
      type: String,
      enum: ["daily", "weekly", "monthly", "yearly"],
      required: true,
    },
    interval: { type: Number, default: 1 },
    daysOfWeek: { type: [Number], default: [] }, // 0-6, where 0 is Sunday
    daysOfMonth: { type: [Number], default: [] }, // 1-31
    monthsOfYear: { type: [Number], default: [] }, // 0-11, where 0 is January
    endDate: { type: Date },
    count: { type: Number },
    exceptions: { type: [Date], default: [] },
  },
  { _id: false },
);

// Define the event schema
const eventSchema = new Schema({
  id: { type: String, required: true, unique: true },
  status: { type: String, required: true, default: "published" },
  name: { type: String, required: true },
  description: { type: String, default: "" },
  location: { type: String, default: "" },
  isVirtual: { type: Boolean, default: false },
  virtualMeetingInfo: { type: virtualMeetingInfoSchema },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  maxAttendees: { type: [String], default: [] },
  category: { type: String, required: true, default: "general" },
  featured: { type: Boolean, default: false },
  price: { type: Number, default: 0 },
  image: { type: String, default: "" },
  createdById: { type: String, required: true, default: "user-id" },
  isRecurring: { type: Boolean, default: false },
  recurrenceRule: { type: recurrenceRuleSchema },
  parentEventId: { type: String }, // For recurring event instances
  originalStartDate: { type: Date }, // For modified instances of recurring events
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Add indexes
eventSchema.index({ id: 1 }, { unique: true });

// Update updatedAt timestamp
eventSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Add static methods
eventSchema.statics.findByIdWithAttendees = async function (id: string) {
  return this.findById(id).populate("attendees");
};

eventSchema.statics.findFeatured = async function () {
  return this.find({ featured: true }).sort({ startDate: 1 }).limit(6);
};

eventSchema.statics.findUpcoming = async function (limit = 10) {
  const now = new Date();
  return this.find({
    endDate: { $gte: now },
    status: { $ne: "cancelled" },
  })
    .sort({ startDate: 1 })
    .limit(limit);
};

eventSchema.statics.findByCategory = async function (category: string) {
  return this.find({ category });
};

eventSchema.statics.findByCreator = async function (userId: string) {
  return this.find({ createdById: userId });
};

eventSchema.statics.countAttendees = async function (eventId: string) {
  // This would typically use a relation or aggregation
  // For now, we'll return a placeholder
  return 0;
};

// Find recurring event instances
eventSchema.statics.findRecurringInstances = async function (
  parentEventId: string,
) {
  return this.find({ parentEventId }).sort({ startDate: 1 });
};

// Find all events in a date range
eventSchema.statics.findInDateRange = async function (
  startDate: Date,
  endDate: Date,
) {
  return this.find({
    $or: [
      // Regular events that overlap with the range
      {
        startDate: { $lte: endDate },
        endDate: { $gte: startDate },
        isRecurring: { $ne: true },
      },
      // Recurring event instances
      {
        startDate: { $lte: endDate },
        endDate: { $gte: startDate },
        parentEventId: { $exists: true },
      },
      // Recurring events that might have instances in the range
      {
        isRecurring: true,
        $or: [
          { "recurrenceRule.endDate": { $gte: startDate } },
          { "recurrenceRule.endDate": { $exists: false } },
        ],
      },
    ],
  }).sort({ startDate: 1 });
};

// Generate recurring event instances
eventSchema.statics.generateRecurringInstances = async function (
  parentEventId: string,
  startDate: Date,
  endDate: Date,
) {
  const parentEvent = await this.findOne({ id: parentEventId });
  if (!parentEvent?.isRecurring || !parentEvent.recurrenceRule) {
    return [];
  }

  // Get existing instances to avoid duplicates
  const existingInstances = await this.find({ parentEventId });
  const existingDates = new Set(
    existingInstances.map(
      (instance) => instance.startDate.toISOString().split("T")[0],
    ),
  );

  // Generate instances based on recurrence rule
  const instances = [];
  const rule = parentEvent.recurrenceRule;
  const eventDuration =
    parentEvent.endDate.getTime() - parentEvent.startDate.getTime();

  let currentDate = new Date(parentEvent.startDate);
  let count = 0;

  while (
    (rule.endDate ? currentDate <= rule.endDate : true) &&
    (rule.count ? count < rule.count : true) &&
    currentDate <= endDate
  ) {
    // Skip the parent event's original date
    if (currentDate.getTime() !== parentEvent.startDate.getTime()) {
      const dateStr = currentDate.toISOString().split("T")[0];

      // Check if this date should be excluded
      const isException = rule.exceptions?.some(
        (exceptionDate) =>
          exceptionDate.toISOString().split("T")[0] === dateStr,
      );

      // Check if an instance already exists for this date
      const instanceExists = existingDates.has(dateStr);

      if (!isException && !instanceExists) {
        // Create a new instance
        const instanceEndDate = new Date(currentDate.getTime() + eventDuration);

        const instance = {
          ...parentEvent.toObject(),
          id: `${parentEvent.id}-${dateStr}`,
          parentEventId: parentEvent.id,
          originalStartDate: new Date(currentDate),
          startDate: new Date(currentDate),
          endDate: instanceEndDate,
          isRecurring: false,
          recurrenceRule: undefined,
        };

        instances.push(instance);
      }
    }

    // Advance to the next occurrence
    currentDate = getNextOccurrence(currentDate, rule);
    count++;
  }

  // Save the generated instances
  if (instances.length > 0) {
    await this.insertMany(instances);
  }

  return instances;
};

// Helper function to get the next occurrence based on recurrence rule
function getNextOccurrence(currentDate: Date, rule: any): Date {
  const nextDate = new Date(currentDate);
  const interval = rule.interval || 1;

  switch (rule.frequency) {
    case "daily":
      nextDate.setDate(nextDate.getDate() + interval);
      break;

    case "weekly":
      if (rule.daysOfWeek && rule.daysOfWeek.length > 0) {
        // Find the next day of week in the rule
        const currentDayOfWeek = nextDate.getDay();
        let nextDayOfWeek = -1;

        // Sort days of week to ensure correct order
        const sortedDays = [...rule.daysOfWeek].sort((a, b) => a - b);

        // Find the next day of week after the current one
        for (const day of sortedDays) {
          if (day > currentDayOfWeek) {
            nextDayOfWeek = day;
            break;
          }
        }

        // If no day found, take the first one and add a week
        if (nextDayOfWeek === -1) {
          nextDayOfWeek = sortedDays[0];
          nextDate.setDate(nextDate.getDate() + 7 * interval);
        }

        // Adjust to the next day of week
        const daysToAdd = (nextDayOfWeek - currentDayOfWeek + 7) % 7;
        nextDate.setDate(nextDate.getDate() + daysToAdd);
      } else {
        // Simple weekly recurrence
        nextDate.setDate(nextDate.getDate() + 7 * interval);
      }
      break;

    case "monthly":
      if (rule.daysOfMonth && rule.daysOfMonth.length > 0) {
        // Find the next day of month in the rule
        const currentDay = nextDate.getDate();
        let nextDay = -1;

        // Sort days of month to ensure correct order
        const sortedDays = [...rule.daysOfMonth].sort((a, b) => a - b);

        // Find the next day of month after the current one
        for (const day of sortedDays) {
          if (day > currentDay) {
            nextDay = day;
            break;
          }
        }

        // If no day found, take the first one and add a month
        if (nextDay === -1) {
          nextDay = sortedDays[0];
          nextDate.setMonth(nextDate.getMonth() + interval);
        }

        // Set the day of month
        nextDate.setDate(nextDay);
      } else {
        // Simple monthly recurrence (same day of month)
        nextDate.setMonth(nextDate.getMonth() + interval);
      }
      break;

    case "yearly":
      if (rule.monthsOfYear && rule.monthsOfYear.length > 0) {
        // Find the next month in the rule
        const currentMonth = nextDate.getMonth();
        let nextMonth = -1;

        // Sort months to ensure correct order
        const sortedMonths = [...rule.monthsOfYear].sort((a, b) => a - b);

        // Find the next month after the current one
        for (const month of sortedMonths) {
          if (month > currentMonth) {
            nextMonth = month;
            break;
          }
        }

        // If no month found, take the first one and add a year
        if (nextMonth === -1) {
          nextMonth = sortedMonths[0];
          nextDate.setFullYear(nextDate.getFullYear() + interval);
        }

        // Set the month
        nextDate.setMonth(nextMonth);
      } else {
        // Simple yearly recurrence (same day of year)
        nextDate.setFullYear(nextDate.getFullYear() + interval);
      }
      break;
  }

  return nextDate;
}

// Ensure dates are valid
eventSchema.pre("save", function (next) {
  console.log("Pre-save hook running for event:", this.id);

  // Set default dates if not valid
  if (
    !this.startDate ||
    !(this.startDate instanceof Date) ||
    isNaN(this.startDate.getTime())
  ) {
    console.log("Setting default startDate");
    this.startDate = new Date();
  }

  if (
    !this.endDate ||
    !(this.endDate instanceof Date) ||
    isNaN(this.endDate.getTime())
  ) {
    console.log("Setting default endDate");
    // Set end date to 1 hour after start date
    this.endDate = new Date(this.startDate.getTime() + 60 * 60 * 1000);
  }

  // Ensure status is set
  if (!this.status) {
    console.log("Setting default status");
    this.status = "published";
  }

  // Ensure category is set
  if (!this.category) {
    console.log("Setting default category");
    this.category = "general";
  }

  // Ensure createdById is set
  if (!this.createdById) {
    console.log("Setting default createdById");
    this.createdById = "user-id";
  }

  // Update timestamps
  this.updatedAt = new Date();

  console.log("Pre-save hook completed for event:", this.id);
  next();
});

// Create the model
const EventDB =
  mongoose.models.Event ||
  mongoose.model<EventDocument, EventModel>("Event", eventSchema);

export default EventDB;
