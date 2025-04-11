import mongoose from 'mongoose';
import { compare, hash } from 'bcryptjs';
import { UserDocument, UserModel } from './types';

const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: String,
  email: { type: String, required: true },
  emailVerified: Date,
  image: String,
  password: { type: String },
  role: { type: String, enum: ['admin', 'super_admin'], default: 'admin' },
  firstName: { type: String },
  lastName: { type: String },
  profileImage: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Add static methods
userSchema.statics.findByEmail = async function(email: string) {
  return this.findOne({ email });
};

userSchema.statics.validatePassword = async function(password: string, hashedPassword: string) {
  return compare(password, hashedPassword);
};

// Add pre-save hook for password hashing
userSchema.pre('save', async function(next) {
  const user = this as UserDocument;

  // Only hash the password if it has been modified (or is new)
  if (!user.isModified('password')) return next();

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
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const User = (mongoose.models.User || mongoose.model<UserDocument, UserModel>('User', userSchema)) as UserModel;
