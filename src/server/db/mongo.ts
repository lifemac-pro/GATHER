import mongoose from "mongoose";
import { env } from "@/env";

if (!env.DATABASE_URL) {
  throw new Error('Please add your MongoDB connection string to .env');
}

let isConnected = false; // Track connection status

export async function connectToDatabase() {
  if (isConnected) {
    console.log("MongoDB already connected");
    return mongoose;
  }

  if (mongoose.connection.readyState > 0) {
    await mongoose.connection.close();
  }

  try {
    await mongoose.connect(env.DATABASE_URL);
    isConnected = true;
    console.log("MongoDB connected");
    return mongoose;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
}

// Connect on app startup
connectToDatabase();
