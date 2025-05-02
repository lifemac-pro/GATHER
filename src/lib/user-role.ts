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
  try {
    // Check cache first
    if (roleCache.has(userId)) {
      return roleCache.get(userId) || null;
    }

    await connectToDatabase();

    // Find the user in our database
    const user = await User.findOne({ id: userId });

    if (!user) {
      return null;
    }

    // Cache the role
    roleCache.set(userId, user.role);

    return user.role || null;
  } catch (error) {
    console.error("Error getting user role:", error);
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
  try {
    await connectToDatabase();

    // Update the user's role
    const user = await User.findOneAndUpdate(
      { id: userId },
      { 
        $set: { 
          role,
          updatedAt: new Date()
        }
      },
      { new: true }
    );

    if (!user) {
      return false;
    }

    // Update cache
    roleCache.set(userId, role);

    return true;
  } catch (error) {
    console.error("Error setting user role:", error);
    return false;
  }
}

/**
 * Get the appropriate redirect URL based on user role
 * @param role The user's role
 * @returns The redirect URL
 */
export function getRoleRedirectUrl(role: string | null): string {
  switch (role) {
    case "admin":
      return "/admin/dashboard";
    case "user":
      return "/attendee/dashboard";
    default:
      return "/role-selection";
  }
}
