import mongoose from 'mongoose';

const surveySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  eventId: { type: String, required: true },
  attendeeId: { type: String, required: true },
  feedback: String,
  rating: Number,
  submittedAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes for faster queries
surveySchema.index({ eventId: 1 });
surveySchema.index({ attendeeId: 1 });

export const Survey = mongoose.models.Survey || mongoose.model('Survey', surveySchema);
