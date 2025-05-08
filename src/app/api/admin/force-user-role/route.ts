import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/server/db";
import { User } from "@/server/db/models/user";

/**
 * This API route forces all users to have the "user" role
 * 
 * Access it at: /api/admin/force-user-role
 */
export async function GET(req: NextRequest) {
  try {
    console.log("Force user role API called");
    
    // Connect to the database
    console.log("Connecting to database...");
    await connectToDatabase();
    console.log("Connected to database successfully");
    
    // Find all users
    const users = await User.find({});
    console.log(`Found ${users.length} users`);
    
    // Update all users to have role "user"
    const updateResults = [];
    for (const user of users) {
      console.log(`Updating user ${user.id} (${user.email}) from role ${user.role} to "user"`);
      
      // Force update the role to "user"
      const result = await User.updateOne(
        { id: user.id },
        { $set: { role: "user" } }
      );
      
      updateResults.push({
        id: user.id,
        email: user.email,
        oldRole: user.role,
        newRole: "user",
        updated: result.modifiedCount > 0
      });
    }
    
    // Verify the changes
    const updatedUsers = await User.find({});
    const verificationResults = updatedUsers.map(user => ({
      id: user.id,
      email: user.email,
      role: user.role
    }));
    
    return NextResponse.json({
      success: true,
      message: "All users have been updated to role 'user'",
      updateResults,
      verificationResults
    });
  } catch (error) {
    console.error("Error in force-user-role API:", error);
    
    return NextResponse.json({
      success: false,
      message: "Error updating user roles",
      error: error.message
    }, { status: 500 });
  }
}
