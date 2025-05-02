import mongoose, { Schema } from "mongoose";
import { nanoid } from "nanoid";
import type { BaseDocument, BaseModel } from "./types";

// Define the EventTemplate document interface
export interface EventTemplateDocument extends BaseDocument {
  id: string;
  name: string;
  description?: string;
  category: string;
  location?: string;
  duration: number;
  price: number;
  maxAttendees: number;
  image?: string;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

// Define the EventTemplate model interface
export interface EventTemplateModel extends BaseModel<EventTemplateDocument> {
  findByCreator(userId: string): Promise<EventTemplateDocument[]>;
}

// Define the event template schema
const eventTemplateSchema = new Schema({
  id: { type: String, required: true, unique: true, default: () => nanoid() },
  name: { type: String, required: true },
  description: { type: String, default: "" },
  category: { type: String, required: true, default: "general" },
  location: { type: String, default: "" },
  duration: { type: Number, required: true, min: 30 }, // Duration in minutes
  price: { type: Number, default: 0 },
  maxAttendees: { type: Number, required: true, min: 1 },
  image: { type: String, default: "" },
  createdById: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Add indexes - only in non-edge environment
try {
  eventTemplateSchema.index({ id: 1 }, { unique: true });
  eventTemplateSchema.index({ createdById: 1 });
} catch (error) {
  console.warn("Skipping index creation in edge environment");
}

// Update updatedAt timestamp - only in non-edge environment
try {
  eventTemplateSchema.pre("save", function (next) {
    this.updatedAt = new Date();
    next();
  });
} catch (error) {
  console.warn("Skipping pre-save hook in edge environment");
}

// Add static methods - only in non-edge environment
try {
  eventTemplateSchema.statics.findByCreator = async function (userId: string) {
    return this.find({ createdById: userId }).sort({ createdAt: -1 });
  };
} catch (error) {
  console.warn("Skipping static methods in edge environment");
}

// Create a function to get the EventTemplate model
const getEventTemplateModel = (): EventTemplateModel => {
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
      findByCreator: async () => [],
    } as unknown as EventTemplateModel;
  }

  // Return the actual model
  return (mongoose.models.EventTemplate ||
    mongoose.model<EventTemplateDocument, EventTemplateModel>(
      "EventTemplate",
      eventTemplateSchema
    )) as EventTemplateModel;
};

// Create and export the model
const EventTemplate = getEventTemplateModel();

export default EventTemplate;
export { EventTemplate };
