import mongoose from "mongoose";
import { type UserPreferenceDocument, type UserPreferenceModel } from "./types";

const userPreferenceSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  emailNotifications: { type: Boolean, default: true },
  eventReminders: { type: Boolean, default: true },
  surveyReminders: { type: Boolean, default: true },
  marketingEmails: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Add indexes for faster queries - only in non-edge environment
try {
  userPreferenceSchema.index({ userId: 1 });
} catch (error) {
  console.warn("Skipping index creation in edge environment");
}

// Update timestamps
try {
  userPreferenceSchema.pre("save", function (next) {
    this.updatedAt = new Date();
    next();
  });
} catch (error) {
  console.warn("Skipping pre-save hook in edge environment");
}

// Add static methods
userPreferenceSchema.statics.findByUser = async function (userId: string) {
  return this.findOne({ userId });
};

userPreferenceSchema.statics.updatePreferences = async function (
  userId: string,
  preferences: Partial<UserPreferenceDocument>
) {
  return this.findOneAndUpdate(
    { userId },
    { $set: preferences },
    { new: true, upsert: true }
  );
};

// Create a function to get the UserPreference model
const getUserPreferenceModel = (): UserPreferenceModel => {
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
      findByUser: async () => null,
      updatePreferences: async () => null,
    } as unknown as UserPreferenceModel;
  }

  // Return the actual model
  return (mongoose.models.UserPreference ||
    mongoose.model<UserPreferenceDocument, UserPreferenceModel>(
      "UserPreference",
      userPreferenceSchema,
    )) as UserPreferenceModel;
};

// Export the UserPreference model
export const UserPreference = getUserPreferenceModel();