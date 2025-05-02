import { connectToDatabase } from "@/server/db/mongo";
import { User } from "@/server/db/models";
import mongoose from "mongoose";

async function createUserRecord(userId: string) {
  try {
    console.log("Connecting to database...");
    await connectToDatabase();
    console.log("Connected to database successfully");
    
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

// Replace this with your actual user ID from Clerk
const userId = "YOUR_USER_ID";

if (!userId || userId === "YOUR_USER_ID") {
  console.error("Please replace 'YOUR_USER_ID' with your actual Clerk user ID");
  process.exit(1);
}

createUserRecord(userId); 