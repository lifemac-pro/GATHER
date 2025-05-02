import mongoose, { Schema } from "mongoose";
import { nanoid } from "nanoid";

// Define the EventTag document interface
export interface EventTagDocument extends mongoose.Document {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Define the EventTag model interface
export interface EventTagModelInterface extends mongoose.Model<EventTagDocument> {
  findBySlug(slug: string): Promise<EventTagDocument | null>;
  findActive(): Promise<EventTagDocument[]>;
  findByIds(ids: string[]): Promise<EventTagDocument[]>;
}

// Define the event tag schema
const eventTagSchema = new Schema({
  id: { type: String, required: true, unique: true, default: () => nanoid() },
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, default: "" },
  color: { type: String, default: "#000000" },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Add indexes - only in non-edge environment
try {
  eventTagSchema.index({ id: 1 }, { unique: true });
  eventTagSchema.index({ slug: 1 }, { unique: true });
} catch (error) {
  console.warn("Skipping index creation in edge environment");
}

// Update updatedAt timestamp
eventTagSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Add static methods
eventTagSchema.statics.findBySlug = async function (slug: string) {
  return this.findOne({ slug, isActive: true });
};

eventTagSchema.statics.findActive = async function () {
  return this.find({ isActive: true }).sort({ name: 1 });
};

eventTagSchema.statics.findByIds = async function (ids: string[]) {
  return this.find({ id: { $in: ids }, isActive: true }).sort({ name: 1 });
};

// Create a function to get the EventTag model
const getEventTagModel = (): EventTagModelInterface => {
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
      findBySlug: async () => null,
      findActive: async () => [],
    } as unknown as EventTagModelInterface;
  }

  // Return the actual model
  return (mongoose.models.EventTag ||
    mongoose.model<EventTagDocument, EventTagModelInterface>(
      "EventTag",
      eventTagSchema,
    )) as EventTagModelInterface;
};

// Export the model
export const EventTag = getEventTagModel();
