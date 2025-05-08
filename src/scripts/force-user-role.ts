/**
 * This script forces a user's role to "user" (attendee)
 * 
 * Run with:
 * npx ts-node -r tsconfig-paths/register src/scripts/force-user-role.ts
 */

import { connectToDatabase } from "../server/db";
import { User } from "../server/db/models/user";

async function forceUserRole() {
  try {
    console.log("Connecting to database...");
    await connectToDatabase();
    console.log("Connected to database successfully");

    // Find all users
    const users = await User.find({});
    console.log(`Found ${users.length} users`);

    // Update all users to have role "user"
    for (const user of users) {
      console.log(`Updating user ${user.id} (${user.email}) from role ${user.role} to "user"`);
      
      // Force update the role to "user"
      await User.updateOne(
        { id: user.id },
        { $set: { role: "user" } }
      );
    }

    console.log("All users have been updated to role 'user'");
    
    // Verify the changes
    const updatedUsers = await User.find({});
    for (const user of updatedUsers) {
      console.log(`User ${user.id} (${user.email}) now has role: ${user.role}`);
    }

    console.log("Script completed successfully");
  } catch (error) {
    console.error("Error in forceUserRole script:", error);
  } finally {
    // Close the database connection
    try {
      await (await import("mongoose")).default.disconnect();
      console.log("Database connection closed");
    } catch (error) {
      console.error("Error closing database connection:", error);
    }
    
    // Exit the process
    process.exit(0);
  }
}

// Run the script
forceUserRole();
