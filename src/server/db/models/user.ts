import mongoose from "mongoose";
import { compare, hash } from "bcryptjs";
import { type UserDocument, type UserModel } from "./types";

const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  emailVerified: Date,
  image: String,
  password: { type: String },
  role: {
    type: String,
    enum: ["admin", "super_admin", "user"],
    default: "user"
  },
  firstName: { type: String },
  lastName: { type: String },
  profileImage: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add virtual getter for name
userSchema.virtual("name").get(function(this: UserDocument) {
  if (this.firstName && this.lastName) {
    return `${this.firstName} ${this.lastName}`;
  } else if (this.firstName) {
    return this.firstName;
  } else if (this.lastName) {
    return this.lastName;
  }
  return "Anonymous";
});

// Add virtual getter for fullName (alias for name)
userSchema.virtual("fullName").get(function(this: UserDocument) {
  return this.name;
});

// Add static methods
userSchema.statics.findByEmail = async function (email: string) {
  return this.findOne({ email });
};

userSchema.statics.validatePassword = async function (
  password: string,
  hashedPassword: string,
) {
  return compare(password, hashedPassword);
};

// Add pre-save hook for password hashing
userSchema.pre("save", async function (next) {
  const user = this as unknown as UserDocument;

  // Only hash the password if it has been modified (or is new)
  if (!user.isModified("password")) return next();

  try {
    // Generate a salt and hash the password
    if (user.password) {
      const hashedPassword = await hash(user.password, 10);
      user.password = hashedPassword as any;
    }
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Update timestamps
userSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Create a function to get the User model
export const getUserModel = (): UserModel => {
  // Check if we're in a middleware/edge context or if mongoose is not properly initialized
  if (typeof mongoose.models === 'undefined' || typeof mongoose.model !== 'function') {
    console.log("Creating mock User model for middleware/edge context");

    // Return a mock model for middleware/edge context
    const mockModel = {
      findOne: async (query: any) => {
        console.log("Mock User.findOne called with query:", query);
        return null;
      },
      findById: async (id: string) => {
        console.log("Mock User.findById called with id:", id);
        return null;
      },
      find: async () => {
        console.log("Mock User.find called");
        return [];
      },
      create: async (data: any) => {
        console.log("Mock User.create called with data:", data);
        return data;
      },
      findOneAndUpdate: async (query: any, update: any, options: any) => {
        console.log("Mock User.findOneAndUpdate called with:", { query, update, options });
        return null;
      },
      updateOne: async (query: any, update: any) => {
        console.log("Mock User.updateOne called with:", { query, update });
        return { modifiedCount: 0 };
      },
      deleteOne: async (query: any) => {
        console.log("Mock User.deleteOne called with query:", query);
        return { deletedCount: 0 };
      },
      findByEmail: async (email: string) => {
        console.log("Mock User.findByEmail called with email:", email);
        return null;
      },
      validatePassword: async () => false,
    } as unknown as UserModel;

    return mockModel;
  }

  try {
    // Return the actual model
    console.log("Getting real User model");
    return (mongoose.models.User ||
      mongoose.model<UserDocument, UserModel>("User", userSchema)) as UserModel;
  } catch (error) {
    console.error("Error creating User model:", error);

    // Return a mock model as fallback
    return {
      findOne: async () => null,
      findById: async () => null,
      find: async () => [],
      create: async () => ({}),
      updateOne: async () => ({}),
      deleteOne: async () => ({}),
      findByEmail: async () => null,
      validatePassword: async () => false,
    } as unknown as UserModel;
  }
};

// Export the User model
export const User = getUserModel();
