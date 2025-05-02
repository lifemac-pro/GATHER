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

// Add indexes - only in non-edge environment
try {
  settingSchema.index({ type: 1 }, { unique: true });
} catch (error) {
  console.warn("Skipping index creation in edge environment");
}

// Update updatedAt timestamp - only in non-edge environment
try {
  settingSchema.pre("save", function (next) {
    this.updatedAt = new Date();
    next();
  });
} catch (error) {
  console.warn("Skipping pre-save hook in edge environment");
}

// Create a function to get the Setting model
const getSettingModel = (): mongoose.Model<SettingDocument> => {
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
    } as unknown as mongoose.Model<SettingDocument>;
  }

  // Return the actual model
  return (mongoose.models.Setting ||
    mongoose.model<SettingDocument>(
      "Setting",
      settingSchema,
    )) as mongoose.Model<SettingDocument>;
};

// Export the Setting model
export const Setting = getSettingModel();
