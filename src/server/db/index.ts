import { connectToDatabase } from "./mongo";
import mongoose from "mongoose";

export * from "./models";
export { connectToDatabase };

// Initialize database connection
void connectToDatabase();

// Export the mongoose connection
export const db = mongoose.connection;
