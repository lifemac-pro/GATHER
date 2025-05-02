import mongoose, { Schema } from "mongoose";
import { nanoid } from "nanoid";
import { Event } from "./event-fixed";

// Define the RecurringEvent document interface
export interface RecurringEventDocument extends mongoose.Document {
  id: string;
  parentEventId: string;
  recurrencePattern: {
    frequency: "daily" | "weekly" | "monthly" | "yearly";
    interval: number;
    daysOfWeek?: number[]; // 0 = Sunday, 1 = Monday, etc.
    dayOfMonth?: number;
    monthOfYear?: number;
    endDate?: Date;
    count?: number;
  };
  excludedDates: Date[];
  modifiedOccurrences: {
    date: Date;
    eventId: string;
  }[];
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

// Define the RecurringEvent model interface
export interface RecurringEventModelInterface extends mongoose.Model<RecurringEventDocument> {
  findByParentEvent(eventId: string): Promise<RecurringEventDocument | null>;
  generateOccurrences(
    recurringEventId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<{ date: Date; eventId?: string }[]>;
}

// Define the recurring event schema
const recurringEventSchema = new Schema({
  id: { type: String, required: true, unique: true, default: () => nanoid() },
  parentEventId: { type: String, required: true, ref: "Event" },
  recurrencePattern: {
    frequency: { 
      type: String, 
      required: true, 
      enum: ["daily", "weekly", "monthly", "yearly"] 
    },
    interval: { type: Number, required: true, min: 1, default: 1 },
    daysOfWeek: { type: [Number], default: [] }, // For weekly recurrence
    dayOfMonth: { type: Number }, // For monthly recurrence
    monthOfYear: { type: Number }, // For yearly recurrence
    endDate: { type: Date },
    count: { type: Number, min: 1 },
  },
  excludedDates: { type: [Date], default: [] },
  modifiedOccurrences: [{
    date: { type: Date, required: true },
    eventId: { type: String, required: true, ref: "Event" },
  }],
  createdById: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Add indexes - only in non-edge environment
try {
  recurringEventSchema.index({ id: 1 }, { unique: true });
  recurringEventSchema.index({ parentEventId: 1 }, { unique: true });
} catch (error) {
  console.warn("Skipping index creation in edge environment");
}

// Update updatedAt timestamp
recurringEventSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Add static methods
recurringEventSchema.statics.findByParentEvent = async function (eventId: string) {
  return this.findOne({ parentEventId: eventId });
};

// Generate occurrences for a recurring event
recurringEventSchema.statics.generateOccurrences = async function (
  recurringEventId: string,
  startDate: Date,
  endDate: Date
) {
  // Find the recurring event
  const recurringEvent = await this.findOne({ id: recurringEventId });
  if (!recurringEvent) {
    throw new Error("Recurring event not found");
  }
  
  // Find the parent event
  const parentEvent = await Event.findOne({ id: recurringEvent.parentEventId });
  if (!parentEvent) {
    throw new Error("Parent event not found");
  }
  
  // Get the recurrence pattern
  const { frequency, interval, daysOfWeek, dayOfMonth, monthOfYear, endDate: recurrenceEndDate, count } = recurringEvent.recurrencePattern;
  
  // Calculate the end date for recurrence
  let effectiveEndDate = endDate;
  if (recurrenceEndDate && recurrenceEndDate < endDate) {
    effectiveEndDate = recurrenceEndDate;
  }
  
  // Generate occurrences
  const occurrences: { date: Date; eventId?: string }[] = [];
  let currentDate = new Date(parentEvent.startDate);
  let occurrenceCount = 0;
  
  while (currentDate <= effectiveEndDate && (!count || occurrenceCount < count)) {
    // Skip the first occurrence if it's before the requested start date
    if (currentDate >= startDate) {
      // Check if this date is excluded
      const isExcluded = recurringEvent.excludedDates.some(
        (excludedDate) => excludedDate.toDateString() === currentDate.toDateString()
      );
      
      if (!isExcluded) {
        // Check if this occurrence has been modified
        const modifiedOccurrence = recurringEvent.modifiedOccurrences.find(
          (occurrence) => occurrence.date.toDateString() === currentDate.toDateString()
        );
        
        if (modifiedOccurrence) {
          occurrences.push({
            date: currentDate,
            eventId: modifiedOccurrence.eventId,
          });
        } else {
          occurrences.push({
            date: currentDate,
          });
        }
      }
      
      occurrenceCount++;
    }
    
    // Calculate the next occurrence date based on frequency
    switch (frequency) {
      case "daily":
        currentDate = new Date(currentDate.setDate(currentDate.getDate() + interval));
        break;
        
      case "weekly":
        if (daysOfWeek && daysOfWeek.length > 0) {
          // For weekly recurrence with specific days of the week
          let found = false;
          const startDay = currentDate.getDay();
          const startDate = new Date(currentDate);
          
          // Try each day of the week
          for (let i = 1; i <= 7; i++) {
            const nextDate = new Date(startDate);
            nextDate.setDate(nextDate.getDate() + i);
            const nextDay = nextDate.getDay();
            
            if (daysOfWeek.includes(nextDay) && nextDate > currentDate) {
              currentDate = nextDate;
              found = true;
              break;
            }
          }
          
          // If no valid day found, move to the next week
          if (!found) {
            currentDate = new Date(startDate);
            currentDate.setDate(currentDate.getDate() + (7 * interval));
          }
        } else {
          // Simple weekly recurrence
          currentDate = new Date(currentDate.setDate(currentDate.getDate() + (7 * interval)));
        }
        break;
        
      case "monthly":
        if (dayOfMonth) {
          // Set to specific day of month
          const nextMonth = new Date(currentDate);
          nextMonth.setMonth(nextMonth.getMonth() + interval);
          nextMonth.setDate(Math.min(dayOfMonth, new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate()));
          currentDate = nextMonth;
        } else {
          // Same day of month
          const day = currentDate.getDate();
          currentDate = new Date(currentDate.setMonth(currentDate.getMonth() + interval));
          // Handle edge cases (e.g., Jan 31 -> Feb 28)
          const maxDays = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
          currentDate.setDate(Math.min(day, maxDays));
        }
        break;
        
      case "yearly":
        if (monthOfYear !== undefined && dayOfMonth) {
          // Set to specific month and day
          const nextYear = new Date(currentDate);
          nextYear.setFullYear(nextYear.getFullYear() + interval);
          nextYear.setMonth(monthOfYear);
          nextYear.setDate(Math.min(dayOfMonth, new Date(nextYear.getFullYear(), monthOfYear + 1, 0).getDate()));
          currentDate = nextYear;
        } else {
          // Same month and day
          currentDate = new Date(currentDate.setFullYear(currentDate.getFullYear() + interval));
        }
        break;
    }
  }
  
  return occurrences;
};

// Create a function to get the RecurringEvent model
const getRecurringEventModel = (): RecurringEventModelInterface => {
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
      findByParentEvent: async () => null,
      generateOccurrences: async () => [],
    } as unknown as RecurringEventModelInterface;
  }

  // Return the actual model
  return (mongoose.models.RecurringEvent ||
    mongoose.model<RecurringEventDocument, RecurringEventModelInterface>(
      "RecurringEvent",
      recurringEventSchema,
    )) as RecurringEventModelInterface;
};

// Export the model
export const RecurringEvent = getRecurringEventModel();
