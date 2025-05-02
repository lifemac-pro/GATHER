import mongoose, { Schema } from "mongoose";
import { nanoid } from "nanoid";

// Define the EventCategory document interface
export interface EventCategoryDocument extends mongoose.Document {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  parentId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Define the EventCategory model interface
export interface EventCategoryModelInterface extends mongoose.Model<EventCategoryDocument> {
  findBySlug(slug: string): Promise<EventCategoryDocument | null>;
  findActive(): Promise<EventCategoryDocument[]>;
  findWithSubcategories(): Promise<EventCategoryDocument[]>;
}

// Define the event category schema
const eventCategorySchema = new Schema({
  id: { type: String, required: true, unique: true, default: () => nanoid() },
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, default: "" },
  icon: { type: String, default: "" },
  color: { type: String, default: "#000000" },
  parentId: { type: String, default: null, ref: "EventCategory" },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Add indexes - only in non-edge environment
try {
  eventCategorySchema.index({ id: 1 }, { unique: true });
  eventCategorySchema.index({ slug: 1 }, { unique: true });
  eventCategorySchema.index({ parentId: 1 });
} catch (error) {
  console.warn("Skipping index creation in edge environment");
}

// Update updatedAt timestamp
eventCategorySchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Add static methods
eventCategorySchema.statics.findBySlug = async function (slug: string) {
  return this.findOne({ slug, isActive: true });
};

eventCategorySchema.statics.findActive = async function () {
  return this.find({ isActive: true }).sort({ name: 1 });
};

eventCategorySchema.statics.findWithSubcategories = async function () {
  // First get all parent categories
  const parentCategories = await this.find({ parentId: null, isActive: true }).sort({ name: 1 });
  
  // For each parent category, get its subcategories
  const categoriesWithSubs = await Promise.all(
    parentCategories.map(async (parent) => {
      const subcategories = await this.find({ parentId: parent.id, isActive: true }).sort({ name: 1 });
      return {
        ...parent.toObject(),
        subcategories: subcategories.map(sub => sub.toObject()),
      };
    })
  );
  
  return categoriesWithSubs;
};

// Create a function to get the EventCategory model
const getEventCategoryModel = (): EventCategoryModelInterface => {
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
      findBySlug: async () => null,
      findActive: async () => [],
      findWithSubcategories: async () => [],
    } as unknown as EventCategoryModelInterface;
  }

  // Return the actual model
  return (mongoose.models.EventCategory ||
    mongoose.model<EventCategoryDocument, EventCategoryModelInterface>(
      "EventCategory",
      eventCategorySchema,
    )) as EventCategoryModelInterface;
};

// Export the model
export const EventCategory = getEventCategoryModel();
