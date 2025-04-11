import mongoose, { Schema } from 'mongoose';
import { EventDocument, EventModel } from './types';

const eventSchema = new Schema({
  id: { type: String, required: true, unique: true },
  status: { type: String, required: true },
  name: { type: String, required: true },
  description: String,
  location: String,
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  maxAttendees: [String],
  category: { type: String, required: true },
  featured: { type: Boolean, default: false },
  price: { type: Number, default: 0 },
  createdById: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Add indexes
eventSchema.index({ id: 1 }, { unique: true });

// Update updatedAt timestamp
eventSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Add static methods
eventSchema.statics.findByIdWithAttendees = async function(id: string) {
  return this.findById(id).populate('attendees');
};

eventSchema.statics.findFeatured = async function() {
  return this.find({ featured: true }).sort({ startDate: 1 }).limit(6);
};

eventSchema.statics.findUpcoming = async function(limit = 10) {
  const now = new Date();
  return this.find({
    endDate: { $gte: now },
    status: { $ne: 'cancelled' }
  }).sort({ startDate: 1 }).limit(limit);
};

eventSchema.statics.findByCategory = async function(category: string) {
  return this.find({ category });
};

eventSchema.statics.findByCreator = async function(userId: string) {
  return this.find({ createdById: userId });
};

eventSchema.statics.countAttendees = async function(eventId: string) {
  // This would typically use a relation or aggregation
  // For now, we'll return a placeholder
  return 0;
};

// Update timestamps
eventSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const Event = (mongoose.models.Event || mongoose.model<EventDocument, EventModel>("Event", eventSchema)) as EventModel;
