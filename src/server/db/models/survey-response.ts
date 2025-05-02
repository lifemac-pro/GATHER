import mongoose from "mongoose";
import { nanoid } from "nanoid";
import { type SurveyResponseDocument } from "./types";

const answerSchema = new mongoose.Schema({
  questionId: { type: String, required: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true }, // Can be string, number, array, etc.
});

const surveyResponseSchema = new mongoose.Schema({
  id: { type: String, default: () => nanoid(), required: true, unique: true },
  surveyId: { type: String, required: true },
  userId: { type: String, required: true },
  answers: [answerSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Indexes for faster queries
surveyResponseSchema.index({ surveyId: 1, userId: 1 });

// Update timestamps
surveyResponseSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Get SurveyResponse model
const getSurveyResponseModel = (): mongoose.Model<SurveyResponseDocument> => {
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
    } as unknown as mongoose.Model<SurveyResponseDocument>;
  }

  // Return the actual model
  return (mongoose.models.SurveyResponse ||
    mongoose.model<SurveyResponseDocument>(
      "SurveyResponse",
      surveyResponseSchema,
    )) as mongoose.Model<SurveyResponseDocument>;
};

// Export the SurveyResponse model
export const SurveyResponse = getSurveyResponseModel();