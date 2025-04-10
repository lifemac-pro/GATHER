import mongoose from "mongoose";
import { nanoid } from "nanoid";

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

export const Chat = mongoose.models.Chat || mongoose.model("Chat", chatSchema);

export function create(arg0: { eventId: string; userId: any; message: string; type: string; }) {
  throw new Error("Function not implemented.");
}
