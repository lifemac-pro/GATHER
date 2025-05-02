import mongoose from "mongoose";
import { nanoid } from "nanoid";
import { type SurveyDocument, type SurveyModel } from "./types";

const responseSchema = new mongoose.Schema({
  questionId: { type: String, required: true },
  questionText: { type: String, required: true },
  answer: { type: mongoose.Schema.Types.Mixed, required: true }, // Can be string, number, array, etc.
});

const surveySchema = new mongoose.Schema({
  id: { type: String, default: () => nanoid(), required: true, unique: true },
  eventId: { type: String, required: true },
  templateId: { type: String, required: true },
  userId: { type: String, required: true },
  responses: [responseSchema],
  rating: Number,
  feedback: String,
  submittedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Indexes for faster queries - only in non-edge environment
try {
  surveySchema.index({ eventId: 1 });
  surveySchema.index({ userId: 1 });
  surveySchema.index({ templateId: 1 });
} catch (error) {
  console.warn("Skipping index creation in edge environment");
}

// Update updatedAt timestamp - only in non-edge environment
try {
  surveySchema.pre("save", function (next) {
    this.updatedAt = new Date();
    next();
  });
} catch (error) {
  console.warn("Skipping pre-save hook in edge environment");
}

// Create a function to get the Survey model
const getSurveyModel = (): SurveyModel => {
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
      lean: async () => [],
      populate: async () => {},
      findByEvent: async () => [],
      findByUser: async () => [],
      findByTemplate: async () => [],
      getEventRating: async () => 0,
    } as unknown as SurveyModel;
  }

  // Return the actual model
  return (mongoose.models.Survey as unknown as SurveyModel ||
    mongoose.model<SurveyDocument, SurveyModel>(
      "Survey",
      surveySchema,
    ) as SurveyModel);
};

// Export the Survey model
export const Survey = getSurveyModel();
