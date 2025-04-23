import mongoose from "mongoose";
import { nanoid } from "nanoid";
import { type SettingDocument } from "./types";

const settingSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => nanoid(),
    required: true,
    unique: true,
  },
  type: {
    type: String,
    required: true,
    enum: ["email", "general", "notifications"],
    unique: true,
  },
  value: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Add indexes
settingSchema.index({ type: 1 }, { unique: true });

// Update updatedAt timestamp
settingSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

export const Setting = (mongoose.models.Setting ||
  mongoose.model<SettingDocument>(
    "Setting",
    settingSchema,
  )) as mongoose.Model<SettingDocument>;
