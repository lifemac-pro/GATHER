import { NextResponse } from "next/server";
import { connectToDatabase } from "@/server/db/mongo";
import { getUserModel } from "@/server/db/models/user";
import mongoose from "mongoose";

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    console.log("Connecting to database...");
    await connectToDatabase();
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

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Error creating user record:", error);
    return NextResponse.json(
      { error: "Failed to create user record" },
      { status: 500 }
    );
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log("Database connection closed");
  }
} 