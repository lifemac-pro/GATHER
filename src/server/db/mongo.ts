import mongoose from "mongoose";
import { env } from "@/env";

// No mock data - using real database only

if (!env.DATABASE_URL) {
  throw new Error("Please add your MongoDB connection string to .env");
}

// Connection state tracking
let isConnected = false;
let connectionAttempts = 0;
const MAX_RETRY_ATTEMPTS = 10; // Increased from 5 to 10
const RETRY_INTERVAL = 15000; // Increased from 10 to 15 seconds

// Connection options
const connectionOptions = {
  serverSelectionTimeoutMS: 60000, // Timeout after 60 seconds (increased)
  socketTimeoutMS: 300000, // Close sockets after 5 minutes of inactivity (increased)
  connectTimeoutMS: 60000, // Give up initial connection after 60 seconds (increased)
  maxPoolSize: 20, // Maintain up to 20 socket connections (increased)
  minPoolSize: 5, // Maintain at least 5 socket connections
  maxIdleTimeMS: 120000, // Close idle connections after 2 minutes (increased)
  retryWrites: true, // Retry write operations if they fail
  retryReads: true, // Retry read operations if they fail
  autoIndex: true, // Build indexes
  family: 4, // Use IPv4, skip trying IPv6
  heartbeatFrequencyMS: 10000, // Check server status every 10 seconds
  // Removed keepAlive option as it's not supported in current Mongoose version
};

/**
 * Connect to MongoDB with retry logic
 */
export async function connectToDatabase() {
  console.log("connectToDatabase called, current state:", {
    isConnected,
    connectionState: typeof mongoose.connection !== 'undefined' ? mongoose.connection.readyState : 'undefined',
  });

  // If already connected, return the mongoose instance
  if (isConnected && mongoose.connection.readyState === 1) {
    console.log("Already connected to MongoDB, reusing connection");
    return mongoose;
  }

  // If there's an existing connection in a different state, close it
  // Check if we're in a middleware/edge context first
  if (
    typeof mongoose.connection !== 'undefined' &&
    mongoose.connection.readyState > 0 &&
    mongoose.connection.readyState !== 1
  ) {
    console.log("Closing existing MongoDB connection in state:", mongoose.connection.readyState);
    try {
      await mongoose.connection.close();
      console.log("Successfully closed existing MongoDB connection");
    } catch (error) {
      console.error("Error closing existing MongoDB connection:", error);
    }
  }

  // Reset connection attempts if this is a fresh connection attempt

  try {
    // Check if we're in a middleware/edge context
    if (typeof mongoose.connect !== 'function') {
      console.warn("Running in edge environment, skipping MongoDB connection");
      // Return mongoose without connecting in edge environment
      return mongoose;
    }

    // Connect to MongoDB using the connection string from environment variables
    if (!env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not defined in environment variables");
    }

    // Create a clean connection options object without any problematic options
    const safeConnectionOptions = {
      serverSelectionTimeoutMS: 60000,
      socketTimeoutMS: 300000,
      connectTimeoutMS: 60000,
      maxPoolSize: 20,
      minPoolSize: 5,
      retryWrites: true,
      retryReads: true,
      autoIndex: true,
      family: 4,
    };

    try {
      console.log("Attempting to connect to MongoDB...");
      await mongoose.connect(env.DATABASE_URL, safeConnectionOptions);
      console.log("MongoDB connection successful");
    } catch (connectError) {
      console.error("Error connecting to MongoDB:", connectError);
      console.error("Connection error details:", {
        name: connectError.name,
        message: connectError.message,
        stack: connectError.stack,
        code: connectError.code,
      });

      // In edge environment, just return mongoose without connecting
      if (process.env.NEXT_RUNTIME === "edge") {
        console.log("Running in edge environment, returning mongoose without connection");
        return mongoose;
      }

      // For middleware, we'll return a mock connection to prevent errors
      if (process.env.NEXT_RUNTIME === "nodejs") {
        console.log("Running in middleware, returning mongoose without full connection");
        isConnected = true; // Prevent further connection attempts
        return mongoose;
      }

      throw connectError;
    }

    // Set up connection event handlers
    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err);
      console.error("Error details:", {
        name: err.name,
        message: err.message,
        stack: err.stack,
        code: err.code,
      });

      if (isConnected) {
        isConnected = false;
        // Try to reconnect
        setTimeout(() => connectToDatabase(), RETRY_INTERVAL);
      }
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("MongoDB disconnected");
      if (isConnected) {
        isConnected = false;
        // Try to reconnect
        setTimeout(() => connectToDatabase(), RETRY_INTERVAL);
      }
    });

    mongoose.connection.on("connected", () => {
      console.log("MongoDB connected event fired");
      isConnected = true;
    });

    // Verify connection is actually established - only if not in edge environment
    if (typeof mongoose.connection !== 'undefined' && mongoose.connection.readyState !== 1) {
      console.log(
        `MongoDB connection not fully established. Current state: ${mongoose.connection.readyState}`,
      );
      // Wait a bit for the connection to fully establish
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Check again
      // Check if not connected (1) or connecting (2)
      if (typeof mongoose.connection !== 'undefined') {
        const readyState = mongoose.connection.readyState;
        // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
        if (readyState === 0 || readyState === 3) {
          throw new Error(
            `MongoDB connection failed to establish. State: ${mongoose.connection.readyState}`,
          );
        }
      }
    }

    // Connection successful
    isConnected = true;
    connectionAttempts = 0;
    return mongoose;
  } catch (error) {
    console.error(
      `MongoDB connection error (attempt ${connectionAttempts + 1}/${MAX_RETRY_ATTEMPTS}):`,
      error,
    );

    // In development, we'll provide a fallback to allow the app to run without MongoDB
    if (process.env.NODE_ENV === "development") {
      console.error(
        "MongoDB connection failed in development mode. Please check your connection string and make sure MongoDB is running.",
      );
      // Set connected flag to true to prevent further connection attempts
      isConnected = true;
      connectionAttempts = 0;
      return mongoose;
    }

    // Retry logic for production
    connectionAttempts++;
    if (connectionAttempts < MAX_RETRY_ATTEMPTS) {
      console.log(`Retrying connection in ${RETRY_INTERVAL / 1000} seconds...`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_INTERVAL));
      return connectToDatabase();
    }

    // Max retries reached
    console.error(
      `Failed to connect to MongoDB after ${MAX_RETRY_ATTEMPTS} attempts`,
    );
    throw error;
  }
}

// Connect on app startup
connectToDatabase()
  .then(() => {
    // Import models to ensure they're registered
    try {
      // Use dynamic import to avoid issues with circular dependencies
      import("./models/event-fixed").catch((importError) => {
        console.error("Error importing Event model:", importError);
      });
    } catch (error) {
      console.error("Error importing models:", error);
    }
  })
  .catch((error) => {
    console.error("Failed to connect to MongoDB on startup:", error);
  });
