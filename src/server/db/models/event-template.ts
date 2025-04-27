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

// Add indexes
eventTemplateSchema.index({ id: 1 }, { unique: true });
eventTemplateSchema.index({ createdById: 1 });

// Update updatedAt timestamp
eventTemplateSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Add static methods
eventTemplateSchema.statics.findByCreator = async function (userId: string) {
  return this.find({ createdById: userId }).sort({ createdAt: -1 });
};

// Create and export the model
const EventTemplate = (mongoose.models.EventTemplate ||
  mongoose.model<EventTemplateDocument, EventTemplateModel>(
    "EventTemplate",
    eventTemplateSchema
  )) as EventTemplateModel;

export default EventTemplate;
export { EventTemplate };
