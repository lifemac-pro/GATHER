import mongoose from "mongoose";
import { nanoid } from "nanoid";
import { type SurveyTemplateDocument } from "./types";

const questionSchema = new mongoose.Schema({
  id: { type: String, default: () => nanoid(), required: true },
  text: { type: String, required: true },
  type: {
    type: String,
    enum: ["text", "rating", "multiple_choice", "checkbox", "dropdown"],
    required: true,
  },
  required: { type: Boolean, default: false },
  options: [String], // For multiple choice, checkbox, dropdown
  order: { type: Number, required: true },
});

const surveyTemplateSchema = new mongoose.Schema({
  id: { type: String, default: () => nanoid(), required: true, unique: true },
  eventId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  description: { type: String },
  questions: [questionSchema],
  isActive: { type: Boolean, default: true },
  sendTiming: {
    type: String,
    enum: ["after_event", "during_event", "custom"],
    default: "after_event",
  },
  sendDelay: { type: Number }, // Hours after event ends (for after_event)
  sendTime: { type: Date }, // Specific time to send (for custom)
  reminderEnabled: { type: Boolean, default: false },
  reminderDelay: { type: Number }, // Hours after initial send
  createdById: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Update updatedAt timestamp
surveyTemplateSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

export const SurveyTemplate = (mongoose.models.SurveyTemplate ||
  mongoose.model<SurveyTemplateDocument>(
    "SurveyTemplate",
    surveyTemplateSchema,
  )) as mongoose.Model<SurveyTemplateDocument>;
