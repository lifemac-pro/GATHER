import mongoose from "mongoose";
import { nanoid } from "nanoid";
import { type RegistrationSubmissionDocument } from "./types";

// Define the field response schema
const fieldResponseSchema = new mongoose.Schema({
  fieldId: { type: String, required: true },
  fieldLabel: { type: String, required: true },
  value: { type: mongoose.Schema.Types.Mixed }, // Can be string, number, boolean, array, etc.
  fileUrl: { type: String }, // For file uploads
});

// Define the section response schema
const sectionResponseSchema = new mongoose.Schema({
  sectionId: { type: String, required: true },
  sectionTitle: { type: String, required: true },
  fields: [fieldResponseSchema],
});

// Define the registration submission schema
const registrationSubmissionSchema = new mongoose.Schema({
  id: { type: String, default: () => nanoid(), required: true, unique: true },
  formId: { type: String, required: true, index: true },
  eventId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  attendeeId: { type: String, index: true }, // Set after approval/confirmation
  sections: [sectionResponseSchema],
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "cancelled", "confirmed"],
    default: "pending",
  },
  paymentStatus: {
    type: String,
    enum: ["not_required", "pending", "completed", "failed", "refunded"],
    default: "not_required",
  },
  paymentIntentId: { type: String },
  paymentAmount: { type: Number },
  paymentCurrency: { type: String },
  notes: { type: String }, // Admin notes
  rejectionReason: { type: String },
  submittedAt: { type: Date, default: Date.now },
  approvedAt: { type: Date },
  approvedById: { type: String },
  rejectedAt: { type: Date },
  rejectedById: { type: String },
  confirmedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Update updatedAt timestamp
registrationSubmissionSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Add indexes for faster queries
registrationSubmissionSchema.index({ formId: 1, userId: 1 });
registrationSubmissionSchema.index({ eventId: 1, status: 1 });
registrationSubmissionSchema.index({ submittedAt: 1 });

// Add static methods
registrationSubmissionSchema.statics.findByEvent = async function (eventId: string) {
  return this.find({ eventId }).sort({ submittedAt: -1 });
};

registrationSubmissionSchema.statics.findByUser = async function (userId: string) {
  return this.find({ userId }).sort({ submittedAt: -1 });
};

registrationSubmissionSchema.statics.findByForm = async function (formId: string) {
  return this.find({ formId }).sort({ submittedAt: -1 });
};

registrationSubmissionSchema.statics.countByStatus = async function (eventId: string) {
  return this.aggregate([
    { $match: { eventId } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
};

// Create model with edge runtime handling
let modelName = "RegistrationSubmission";
export const RegistrationSubmission = (process.env.NEXT_RUNTIME === "edge")
  ? (mongoose.models?.[modelName] || mongoose.model(modelName, registrationSubmissionSchema))
  : (mongoose.models?.[modelName] || mongoose.model(modelName, registrationSubmissionSchema));
