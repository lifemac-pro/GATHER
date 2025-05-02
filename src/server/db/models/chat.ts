import mongoose from "mongoose";
import { nanoid } from "nanoid";
import { type ChatDocument } from "./types";

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

// Create a function to get the Chat model
const getChatModel = (): mongoose.Model<ChatDocument> => {
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
    } as unknown as mongoose.Model<ChatDocument>;
  }

  // Return the actual model
  return (mongoose.models.Chat ||
    mongoose.model<ChatDocument>(
      "Chat",
      chatSchema,
    )) as mongoose.Model<ChatDocument>;
};

// Export the Chat model
export const Chat = getChatModel();
