import mongoose from 'mongoose';
import { SurveyDocument } from './types';

const surveySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  eventId: { type: String, required: true },
  userId: { type: String, required: true },
  responses: [{
    question: { type: String, required: true },
    answer: { type: String, required: true }
  }],
  feedback: String,
  rating: Number,
  submittedAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes for faster queries
surveySchema.index({ eventId: 1 });
surveySchema.index({ userId: 1 });

export const Survey = (mongoose.models.Survey || mongoose.model<SurveyDocument>('Survey', surveySchema)) as mongoose.Model<SurveyDocument>;
