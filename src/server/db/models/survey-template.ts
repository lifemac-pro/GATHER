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

// Update updatedAt timestamp - only in non-edge environment
try {
  surveyTemplateSchema.pre("save", function (next) {
    this.updatedAt = new Date();
    next();
  });
} catch (error) {
  console.warn("Skipping pre-save hook in edge environment");
}

// Create a function to get the SurveyTemplate model
const getSurveyTemplateModel = (): mongoose.Model<SurveyTemplateDocument> => {
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
      countDocuments: async () => 0,
    } as unknown as mongoose.Model<SurveyTemplateDocument>;
  }

  // Return the actual model
  return (mongoose.models.SurveyTemplate ||
    mongoose.model<SurveyTemplateDocument>(
      "SurveyTemplate",
      surveyTemplateSchema,
    )) as mongoose.Model<SurveyTemplateDocument>;
};

// Export the SurveyTemplate model
export const SurveyTemplate = getSurveyTemplateModel();
