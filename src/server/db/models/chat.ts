import mongoose from "mongoose";
import { nanoid } from "nanoid";
import { ChatDocument } from "./types";

const chatSchema = new mongoose.Schema({
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
  message: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  type: {
    type: String,
    enum: ["text", "announcement", "system"],
    default: "text",
  },
});

export const Chat = (mongoose.models.Chat || mongoose.model<ChatDocument>("Chat", chatSchema)) as mongoose.Model<ChatDocument>;
