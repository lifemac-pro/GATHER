import mongoose from "mongoose";
import { env } from "@/env";

// No mock data - using real database only

if (!env.DATABASE_URL) {
  throw new Error('Please add your MongoDB connection string to .env');
}

// Connection state tracking
let isConnected = false;
let connectionAttempts = 0;
const MAX_RETRY_ATTEMPTS = 5;
const RETRY_INTERVAL = 3000; // 3 seconds

// Connection options
const connectionOptions = {
  serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  connectTimeoutMS: 10000, // Give up initial connection after 10 seconds
  maxPoolSize: 10, // Maintain up to 10 socket connections
  minPoolSize: 5, // Maintain at least 5 socket connections
  maxIdleTimeMS: 30000, // Close idle connections after 30 seconds
  retryWrites: true, // Retry write operations if they fail
  retryReads: true, // Retry read operations if they fail
};

/**
 * Connect to MongoDB with retry logic
 */
export async function connectToDatabase() {
  // If already connected, return the mongoose instance
  if (isConnected) {
    return mongoose;
  }

  // If there's an existing connection in a different state, close it
  if (mongoose.connection.readyState > 0) {
    await mongoose.connection.close();
  }

  // Reset connection attempts if this is a fresh connection attempt
  if (connectionAttempts === 0) {
    console.log("Attempting to connect to MongoDB...");
  }

  try {
    // Connect to MongoDB using the connection string from environment variables
    await mongoose.connect(env.DATABASE_URL, connectionOptions);

    // Set up connection event handlers
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      if (isConnected) {
        isConnected = false;
        // Try to reconnect
        setTimeout(() => connectToDatabase(), RETRY_INTERVAL);
      }
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
      if (isConnected) {
        isConnected = false;
        // Try to reconnect
        setTimeout(() => connectToDatabase(), RETRY_INTERVAL);
      }
    });

    // Connection successful
    isConnected = true;
    connectionAttempts = 0;
    console.log("MongoDB connected successfully");
    return mongoose;
  } catch (error) {
    console.error(`MongoDB connection error (attempt ${connectionAttempts + 1}/${MAX_RETRY_ATTEMPTS}):`, error);

    // In development, we'll provide a fallback to allow the app to run without MongoDB
    if (process.env.NODE_ENV === 'development') {
      console.error("MongoDB connection failed in development mode. Please check your connection string and make sure MongoDB is running.");
      // Set connected flag to true to prevent further connection attempts
      isConnected = true;
      connectionAttempts = 0;
      return mongoose;
    }

    // Retry logic for production
    connectionAttempts++;
    if (connectionAttempts < MAX_RETRY_ATTEMPTS) {
      console.log(`Retrying connection in ${RETRY_INTERVAL/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL));
      return connectToDatabase();
    }

    // Max retries reached
    console.error(`Failed to connect to MongoDB after ${MAX_RETRY_ATTEMPTS} attempts`);
    throw error;
  }
}

// Connect on app startup
connectToDatabase();
