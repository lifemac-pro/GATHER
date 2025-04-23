import mongoose from "mongoose";
import { type AttendeeDocument, type AttendeeModel } from "./types";

// Define the demographic information schema
const demographicSchema = new mongoose.Schema({
  age: Number,
  dateOfBirth: Date,
  gender: {
    type: String,
    enum: ["male", "female", "non-binary", "prefer-not-to-say", "other"],
  },
  genderOther: String,
  country: String,
  city: String,
  occupation: String,
  industry: String,
  interests: [String],
  dietaryRestrictions: [String],
  accessibilityNeeds: [String],
  howHeard: String,
  languages: [String],
  educationLevel: {
    type: String,
    enum: [
      "high-school",
      "bachelors",
      "masters",
      "doctorate",
      "other",
      "prefer-not-to-say",
    ],
  },
});

const attendeeSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  eventId: { type: String, required: true },
  userId: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: String,
  status: { type: String, required: true },
  paymentStatus: { type: String, default: "pending" },
  paymentIntentId: String,
  ticketCode: String,
  registeredAt: { type: Date, required: true },
  checkedInAt: Date,
  checkedInBy: String,
  checkInNotes: String,
  demographics: demographicSchema,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Indexes for faster queries
attendeeSchema.index({ eventId: 1 });
attendeeSchema.index({ userId: 1 });
attendeeSchema.index({ eventId: 1, userId: 1 }, { unique: true });

// Add static methods
attendeeSchema.statics.findByEventAndUser = async function (
  eventId: string,
  userId: string,
) {
  return this.findOne({ eventId, userId });
};

attendeeSchema.statics.findByEvent = async function (
  eventId: string,
  options = {},
) {
  return this.find({ eventId, ...options });
};

attendeeSchema.statics.findByUser = async function (userId: string) {
  return this.find({ userId });
};

attendeeSchema.statics.checkIn = async function (id: string) {
  return this.findByIdAndUpdate(
    id,
    {
      status: "attended",
      checkedInAt: new Date(),
    },
    { new: true },
  );
};

attendeeSchema.statics.cancel = async function (id: string) {
  return this.findByIdAndUpdate(id, { status: "cancelled" }, { new: true });
};

attendeeSchema.statics.getEventStats = async function (eventId: string) {
  const total = await this.countDocuments({ eventId });
  const checkedIn = await this.countDocuments({
    eventId,
    status: "attended",
  });

  return { total, checkedIn };
};

// Update timestamps
attendeeSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

export const Attendee = (mongoose.models.Attendee ||
  mongoose.model<AttendeeDocument, AttendeeModel>(
    "Attendee",
    attendeeSchema,
  )) as AttendeeModel;
