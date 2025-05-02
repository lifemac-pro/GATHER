import mongoose from "mongoose";
import { nanoid } from "nanoid";
import { type UserPreferenceDocument } from "./types";

const userPreferenceSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => nanoid(),
    required: true,
    unique: true,
  },
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  emailNotifications: {
    type: Boolean,
    default: true,
  },
  eventReminders: {
    type: Boolean,
    default: true,
  },
  surveyReminders: {
    type: Boolean,
    default: true,
  },
  marketingEmails: {
    type: Boolean,
    default: false,
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

export const UserPreference = (mongoose.models.UserPreference ||
  mongoose.model<UserPreferenceDocument>(
    "UserPreference",
    userPreferenceSchema,
  )) as mongoose.Model<UserPreferenceDocument>;
