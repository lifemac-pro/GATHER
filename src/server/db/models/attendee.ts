import mongoose from 'mongoose';

const attendeeSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  eventId: { type: String, required: true },
  userId: { type: String, required: true },
  status: { type: String, required: true },
  paymentStatus: { type: String, default: 'pending' },
  paymentIntentId: String,
  registeredAt: { type: Date, required: true },
  checkedInAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes for faster queries
attendeeSchema.index({ eventId: 1 });
attendeeSchema.index({ userId: 1 });
attendeeSchema.index({ eventId: 1, userId: 1 }, { unique: true });

export const Attendee = mongoose.models.Attendee || mongoose.model('Attendee', attendeeSchema);
