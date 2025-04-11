import mongoose from "mongoose";
import { nanoid } from "nanoid";
import { WaitlistDocument } from "./types";

const waitlistSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => nanoid(),
    required: true,
    unique: true,
  },
  eventId: {
    type: String,
    required: true,
    index: true,
  },
  userId: {
    type: String,
    required: true,
  },
  position: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["waiting", "invited", "expired"],
    default: "waiting",
  },
  invitationSentAt: Date,
  invitationExpiresAt: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Add compound index for uniqueness
waitlistSchema.index({ eventId: 1, userId: 1 }, { unique: true });

export const Waitlist = (mongoose.models.Waitlist || mongoose.model<WaitlistDocument>("Waitlist", waitlistSchema)) as mongoose.Model<WaitlistDocument>;
