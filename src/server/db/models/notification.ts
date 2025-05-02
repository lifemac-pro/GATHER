import mongoose from "mongoose";
import { nanoid } from "nanoid";
import { type NotificationDocument } from "./types";

const notificationSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => nanoid(),
    required: true,
    unique: true,
  },
  userId: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["event", "chat", "system", "reminder"],
    required: true,
  },
  eventId: {
    type: String,
  },
  read: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  actionUrl: String,
});

// Add indexes - only in non-edge environment
try {
  notificationSchema.index({ userId: 1 });
  notificationSchema.index({ eventId: 1 });
} catch (error) {
  console.warn("Skipping index creation in edge environment");
}

// Create a function to get the Notification model
const getNotificationModel = (): mongoose.Model<NotificationDocument> => {
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
      findOneAndUpdate: async () => null,
      updateMany: async () => ({ nModified: 0 }),
    } as unknown as mongoose.Model<NotificationDocument>;
  }

  // Return the actual model
  return (mongoose.models.Notification ||
    mongoose.model<NotificationDocument>(
      "Notification",
      notificationSchema,
    )) as mongoose.Model<NotificationDocument>;
};

// Export the Notification model
export const Notification = getNotificationModel();
