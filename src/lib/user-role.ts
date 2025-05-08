import { User } from "@/server/db/models/user";
import { connectToDatabase } from "@/server/db/mongo";

// Simple in-memory cache for user roles
const roleCache = new Map<string, string>();

/**
 * Get the user's role from the database
 * @param userId The user's ID from Clerk
 * @returns The user's role or null if not found
 */
export async function getUserRole(userId: string): Promise<string | null> {
  console.log("getUserRole called for userId:", userId);

  try {
    // Check cache first
    if (roleCache.has(userId)) {
      const cachedRole = roleCache.get(userId) || null;
      console.log("Role found in cache:", cachedRole);
      return cachedRole;
    }

    console.log("Role not in cache, connecting to database...");
    await connectToDatabase();
    console.log("Connected to database successfully");

    // Find the user in our database
    console.log("Finding user in database with id:", userId);
    const user = await User.findOne({ id: userId });
    console.log("User found:", user ? { id: user.id, role: user.role } : "Not found");

    if (!user) {
      console.log("User not found in database");
      return null;
    }

    // Cache the role
    console.log("Caching role:", user.role);
    roleCache.set(userId, user.role);

    return user.role || null;
  } catch (error) {
    console.error("Error getting user role:", error);
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    return null;
  }
}

/**
 * Set the user's role in the database
 * @param userId The user's ID from Clerk
 * @param role The role to set
 * @returns Success status
 */
export async function setUserRole(userId: string, role: string): Promise<boolean> {
  console.log("setUserRole called for userId:", userId, "with role:", role);

  try {
    console.log("Connecting to database...");
    await connectToDatabase();
    console.log("Connected to database successfully");

    // Check if user already has a role
    console.log("Checking if user already exists with id:", userId);
    const existingUser = await User.findOne({ id: userId });
    console.log("Existing user:", existingUser ? { id: existingUser.id, role: existingUser.role } : "Not found");

    if (existingUser?.role) {
      console.log("User already has role:", existingUser.role);
      // Still update the cache to ensure consistency
      roleCache.set(userId, existingUser.role);
      return true;
    }

    // Update the user's role
    console.log("Updating user role to:", role);
    const user = await User.findOneAndUpdate(
      { id: userId },
      {
        $set: {
          role,
          updatedAt: new Date()
        },
        $setOnInsert: {
          id: userId,
          createdAt: new Date()
        }
      },
      { upsert: true, new: true }
    );

    console.log("Update result:", user ? { id: user.id, role: user.role } : "No result");

    if (!user) {
      console.log("No user returned from update operation");
      return false;
    }

    // Update cache
    console.log("Updating role cache with:", role);
    roleCache.set(userId, role);

    console.log("Role set successfully");
    return true;
  } catch (error) {
    console.error("Error setting user role:", error);
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    return false;
  }
}

/**
 * Get the appropriate redirect URL based on user role
 * @param role The user's role
 * @returns The redirect URL
 */
export function getRoleRedirectUrl(role: string | null): string {
  console.log("getRoleRedirectUrl called with role:", role);

  let redirectUrl = "/role-selection"; // Default

  switch (role) {
    case "admin":
    case "super_admin":
      redirectUrl = "/admin/dashboard";
      break;
    case "user":
    case "attendee":
      redirectUrl = "/attendee/dashboard";
      break;
    default:
      redirectUrl = "/role-selection";
      break;
  }

  console.log("Redirecting to:", redirectUrl);
  return redirectUrl;
}
