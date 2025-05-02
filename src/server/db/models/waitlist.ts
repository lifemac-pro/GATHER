import mongoose from "mongoose";
import { nanoid } from "nanoid";
import { type WaitlistDocument } from "./types";

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

// Add compound index for uniqueness - only in non-edge environment
try {
  waitlistSchema.index({ eventId: 1, userId: 1 }, { unique: true });
} catch (error) {
  console.warn("Skipping index creation in edge environment");
}

// Create a function to get the Waitlist model
const getWaitlistModel = (): mongoose.Model<WaitlistDocument> => {
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
    } as unknown as mongoose.Model<WaitlistDocument>;
  }

  // Return the actual model
  return (mongoose.models.Waitlist ||
    mongoose.model<WaitlistDocument>(
      "Waitlist",
      waitlistSchema,
    )) as mongoose.Model<WaitlistDocument>;
};

// Export the Waitlist model
export const Waitlist = getWaitlistModel();
