import mongoose, { Schema, Document, Model } from 'mongoose';
import { nanoid } from "nanoid";

export interface EventBase {
  id: string;
  status: string;
  name: string;
  description?: string;
  location?: string;
  startDate: Date;
  endDate: Date;
  maxAttendees?: number;
  category: string;
  featured: boolean;
  price: number;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EventDocument extends EventBase, Document {}

export interface EventModel extends Model<EventDocument> {}

const eventSchema = new Schema({
  id: { type: String, required: true, unique: true },
  status: { type: String, required: true },
  name: { type: String, required: true },
  description: String,
  location: String,
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  maxAttendees: Number,
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

export const Event = mongoose.models.Event as EventModel || mongoose.model<EventDocument, EventModel>("Event", eventSchema);
