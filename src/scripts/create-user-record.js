import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getUserModel } from '../server/db/models/user.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function createUserRecord(userId) {
  try {
    console.log("Connecting to database...");
    await mongoose.connect(process.env.DATABASE_URL);
    console.log("Connected to database successfully");
    
    // Get the User model
    const User = getUserModel();
    
    console.log("Creating/updating user record...");
    const user = await User.findOneAndUpdate(
      { id: userId },
      {
        id: userId,
        role: "user", // Default role
        createdAt: new Date(),
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    console.log("User record created/updated successfully:", {
      id: user.id,
      role: user.role,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error("Error creating user record:", error);
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack
      });
    }
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log("Database connection closed");
  }
}

// Get user ID from command line argument
const userId = process.argv[2];

if (!userId) {
  console.error("Please provide your Clerk user ID as a command line argument");
  console.error("Example: node src/scripts/create-user-record.js user_2w7sLhSHAyuyVc3DNEQKAJdpv6L");
  process.exit(1);
}

createUserRecord(userId); 