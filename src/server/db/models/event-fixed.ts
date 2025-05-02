import mongoose, { Schema } from "mongoose";
import { isValid } from "date-fns";

// Define the Event document interface
export interface EventDocument extends mongoose.Document {
  id: string;
  status: string;
  name: string;
  description?: string;
  location?: string;
  startDate: Date;
  endDate: Date;
  maxAttendees?: string[];
  category: string;
  subcategory?: string;
  tags?: string[];
  featured?: boolean;
  price?: number;
  image?: string;
  isVirtual?: boolean;
  virtualMeetingInfo?: {
    platform?: string;
    meetingUrl?: string;
    meetingId?: string;
    password?: string;
  };
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

// Define the Event model interface
export interface EventModelInterface extends mongoose.Model<EventDocument> {
  findByIdWithAttendees(id: string): Promise<EventDocument>;
  findFeatured(): Promise<EventDocument[]>;
  findUpcoming(limit?: number): Promise<EventDocument[]>;
  findByCategory(category: string): Promise<EventDocument[]>;
  findByCreator(userId: string): Promise<EventDocument[]>;
  countAttendees(eventId: string): Promise<number>;
}

// Define the event schema
const eventSchema = new Schema({
  id: { type: String, required: true, unique: true },
  status: { type: String, required: true, default: "published" },
  name: { type: String, required: true },
  description: { type: String, default: "" },
  location: { type: String, default: "" },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  maxAttendees: { type: [String], default: [] },
  category: { type: String, required: true, default: "general" },
  subcategory: { type: String, default: "" },
  tags: { type: [String], default: [] },
  featured: { type: Boolean, default: false },
  price: { type: Number, default: 0 },
  image: { type: String, default: "" },
  isVirtual: { type: Boolean, default: false },
  virtualMeetingInfo: {
    platform: { type: String, default: "" },
    meetingUrl: { type: String, default: "" },
    meetingId: { type: String, default: "" },
    password: { type: String, default: "" },
  },
  createdById: { type: String, required: true, default: "user-id" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Add indexes - only in non-edge environment
try {
  eventSchema.index({ id: 1 }, { unique: true });
} catch (error) {
  console.warn("Skipping index creation in edge environment");
}

// Update updatedAt timestamp - only in non-edge environment
try {
  eventSchema.pre("save", function (next) {
    this.updatedAt = new Date();
    next();
  });
} catch (error) {
  console.warn("Skipping pre-save hook in edge environment");
}

// Add static methods - only in non-edge environment
try {
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
} catch (error) {
  console.warn("Skipping static methods in edge environment");
}

// Ensure dates are valid - only in non-edge environment
try {
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
} catch (error) {
  console.warn("Skipping validation pre-save hook in edge environment");
}

// Create a function to get the Event model
const getEventModel = (): EventModelInterface => {
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
      findByIdWithAttendees: async () => null,
      findFeatured: async () => [],
      findUpcoming: async () => [],
      findByCategory: async () => [],
      findByCreator: async () => [],
      countAttendees: async () => 0,
    } as unknown as EventModelInterface;
  }

  // Return the actual model
  return (mongoose.models.Event ||
    mongoose.model<EventDocument, EventModelInterface>(
      "Event",
      eventSchema,
    )) as EventModelInterface;
};

// Export the Event model
export const Event = getEventModel();
