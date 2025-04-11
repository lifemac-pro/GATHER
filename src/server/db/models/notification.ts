import mongoose from "mongoose";
import { nanoid } from "nanoid";
import { NotificationDocument } from "./types";

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
    index: true,
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
    index: true,
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

export const Notification = (mongoose.models.Notification || mongoose.model<NotificationDocument>("Notification", notificationSchema)) as mongoose.Model<NotificationDocument>;
