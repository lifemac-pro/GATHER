import mongoose from "mongoose";
import { nanoid } from "nanoid";
import { type SurveyDocument } from "./types";

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

// Indexes for faster queries
surveySchema.index({ eventId: 1 });
surveySchema.index({ userId: 1 });
surveySchema.index({ templateId: 1 });

// Update updatedAt timestamp
surveySchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

export const Survey = (mongoose.models.Survey ||
  mongoose.model<SurveyDocument>(
    "Survey",
    surveySchema,
  )) as mongoose.Model<SurveyDocument>;
