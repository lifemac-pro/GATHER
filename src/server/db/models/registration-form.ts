import mongoose from "mongoose";
import { nanoid } from "nanoid";
import { type RegistrationFormDocument } from "./types";

// Define the field schema (similar to survey questions)
const fieldSchema = new mongoose.Schema({
  id: { type: String, default: () => nanoid(), required: true },
  label: { type: String, required: true },
  type: {
    type: String,
    enum: [
      "text",
      "email",
      "phone",
      "number",
      "date",
      "select",
      "checkbox",
      "radio",
      "textarea",
      "file",
    ],
    required: true,
  },
  placeholder: { type: String },
  helpText: { type: String },
  required: { type: Boolean, default: false },
  options: [String], // For select, checkbox, radio
  validation: { type: String }, // Regex pattern or validation rule
  order: { type: Number, required: true },
  defaultValue: { type: String },
  isHidden: { type: Boolean, default: false },
  isSystem: { type: Boolean, default: false }, // For system fields like name, email
  maxLength: { type: Number },
  minLength: { type: Number },
  maxSize: { type: Number }, // For file uploads (in bytes)
  allowedFileTypes: [String], // For file uploads (e.g., ["image/jpeg", "application/pdf"])
});

// Define the section schema for grouping fields
const sectionSchema = new mongoose.Schema({
  id: { type: String, default: () => nanoid(), required: true },
  title: { type: String, required: true },
  description: { type: String },
  order: { type: Number, required: true },
  fields: [fieldSchema],
  isCollapsible: { type: Boolean, default: false },
  isCollapsed: { type: Boolean, default: false },
});

// Define the registration form schema
const registrationFormSchema = new mongoose.Schema({
  id: { type: String, default: () => nanoid(), required: true, unique: true },
  eventId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  description: { type: String },
  sections: [sectionSchema],
  isActive: { type: Boolean, default: true },
  isDefault: { type: Boolean, default: false },
  requiresApproval: { type: Boolean, default: false },
  collectPayment: { type: Boolean, default: false },
  paymentAmount: { type: Number },
  paymentCurrency: { type: String, default: "USD" },
  paymentDescription: { type: String },
  maxRegistrations: { type: Number },
  startDate: { type: Date }, // When registration opens
  endDate: { type: Date }, // When registration closes
  createdById: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Update updatedAt timestamp
registrationFormSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Add static methods
registrationFormSchema.statics.findByEvent = async function (eventId: string) {
  return this.find({ eventId }).sort({ createdAt: -1 });
};

registrationFormSchema.statics.findActiveByEvent = async function (eventId: string) {
  return this.findOne({ eventId, isActive: true }).sort({ createdAt: -1 });
};

// Create and export the model
export const RegistrationForm = (mongoose.models.RegistrationForm ||
  mongoose.model<RegistrationFormDocument>(
    "RegistrationForm",
    registrationFormSchema,
  )) as mongoose.Model<RegistrationFormDocument> & {
    findByEvent(eventId: string): Promise<RegistrationFormDocument[]>;
    findActiveByEvent(eventId: string): Promise<RegistrationFormDocument | null>;
  };
