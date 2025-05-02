import mongoose from "mongoose";
import { nanoid } from "nanoid";
import { type RegistrationSubmissionDocument, type RegistrationSubmissionModel } from "./types";

const fieldResponseSchema = new mongoose.Schema({
  fieldId: { type: String, required: true },
  fieldLabel: { type: String, required: true },
  value: { type: mongoose.Schema.Types.Mixed }, // Can be string, number, array, etc.
  fileUrl: { type: String },
});

const sectionResponseSchema = new mongoose.Schema({
  sectionId: { type: String, required: true },
  sectionTitle: { type: String, required: true },
  fields: [fieldResponseSchema],
});

const formSubmissionSchema = new mongoose.Schema({
  id: { type: String, default: () => nanoid(), required: true, unique: true },
  formId: { type: String, required: true, index: true },
  eventId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
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
  notes: { type: String },
  submittedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Add indexes for common queries
formSubmissionSchema.index({ formId: 1, userId: 1 });
formSubmissionSchema.index({ eventId: 1, status: 1 });
formSubmissionSchema.index({ submittedAt: 1 });

// Update timestamps
formSubmissionSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Add static methods
formSubmissionSchema.statics.findByEvent = async function(eventId: string) {
  return this.find({ eventId }).sort({ submittedAt: -1 });
};

formSubmissionSchema.statics.findByUser = async function(userId: string) {
  return this.find({ userId }).sort({ submittedAt: -1 });
};

formSubmissionSchema.statics.findByForm = async function(formId: string) {
  return this.find({ formId }).sort({ submittedAt: -1 });
};

formSubmissionSchema.statics.countByStatus = async function(eventId: string) {
  return this.aggregate([
    { $match: { eventId } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
};

// Get model with edge runtime handling
const getFormSubmissionModel = (): RegistrationSubmissionModel => {
  if (typeof mongoose.models === "undefined") {
    return {
      findOne: async () => null,
      findById: async () => null,
      find: async () => [],
      create: async () => ({}),
      updateOne: async () => ({}),
      deleteOne: async () => ({}),
      countDocuments: async () => 0,
      findByEvent: async () => [],
      findByUser: async () => [],
      findByForm: async () => [],
      countByStatus: async () => [],
    } as unknown as RegistrationSubmissionModel;
  }

  return (mongoose.models.FormSubmission as unknown as RegistrationSubmissionModel ||
    mongoose.model<RegistrationSubmissionDocument, RegistrationSubmissionModel>(
      "FormSubmission",
      formSubmissionSchema
    ));
};

export const FormSubmission = getFormSubmissionModel();