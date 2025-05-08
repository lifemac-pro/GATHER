import { z } from "zod";
import { createTRPCRouter, protectedProcedure, adminProcedure } from "@/server/api/trpc";
import { User } from "@/server/db/models";
import { TRPCError } from "@trpc/server";
import { connectToDatabase } from "@/server/db/mongo";

export const userRouter = createTRPCRouter({
  // Get current user
  getCurrentUser: protectedProcedure
    .query(async ({ ctx }) => {
      console.log("getCurrentUser query called");

      try {
        console.log("Connecting to database...");
        await connectToDatabase();
        console.log("Connected to database successfully");

        const userId = ctx.session?.userId;
        console.log("User ID from session:", userId);

        if (!userId) {
          console.log("No user ID found in session");
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        console.log("Fetching user with ID:", userId);
        const user = await User.findOne({ id: userId });
        console.log("User found:", user ? { id: user.id, role: user.role } : "Not found");

        if (!user) {
          console.log("User not found in database");
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
          });
        }

        const userData = {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        };

        console.log("Returning user data:", userData);
        return userData;
      } catch (error) {
        console.error("Error getting current user:", error);
        console.error("Error details:", {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });

        if (error instanceof TRPCError) {
          throw error;
        }

        // Handle database connection errors
        if (error.name === "MongooseError" || error.name === "MongoError") {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database connection error. Please try again later."
          });
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get current user"
        });
      }
    }),

  // Create user
  createUser: protectedProcedure
    .input(z.object({
      id: z.string(),
      email: z.string().email(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      image: z.string().optional(),
      role: z.enum(["user", "admin", "super_admin"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      console.log("createUser mutation called with:", {
        id: input.id,
        email: input.email,
        role: input.role
      });

      try {
        console.log("Connecting to database...");
        await connectToDatabase();
        console.log("Connected to database successfully");

        console.log("Creating/updating user with ID:", input.id);
        const user = await User.findOneAndUpdate(
          { id: input.id },
          {
            id: input.id,
            email: input.email,
            firstName: input.firstName,
            lastName: input.lastName,
            image: input.image,
            role: input.role || "user", // Use provided role or default to "user"
            createdAt: new Date(),
            updatedAt: new Date()
          },
          { upsert: true, new: true }
        );

        console.log("User created/updated:", user ? { id: user.id, role: user.role } : "No result");

        if (!user) {
          console.log("No user returned from update operation");
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create user"
          });
        }

        console.log("User creation successful");
        return { success: true, user };
      } catch (error) {
        console.error("Error creating user:", error);
        console.error("Error details:", {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });

        if (error instanceof TRPCError) {
          throw error;
        }

        // Handle database connection errors
        if (error.name === "MongooseError" || error.name === "MongoError") {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database connection error. Please try again later."
          });
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create user"
        });
      }
    }),

  // Set user role
  setRole: protectedProcedure
    .input(z.object({
      role: z.enum(["user", "admin", "super_admin"])
    }))
    .mutation(async ({ ctx, input }) => {
      console.log("setRole mutation called with:", { role: input.role });

      try {
        console.log("Connecting to database...");
        await connectToDatabase();
        console.log("Connected to database successfully");

        const userId = ctx.session?.userId;
        console.log("User ID from session:", userId);

        if (!userId) {
          console.log("No user ID found in session");
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        // Check if user already has a role
        console.log("Checking if user exists:", userId);
        const existingUser = await User.findOne({ id: userId });
        console.log("Existing user:", existingUser ? { id: existingUser.id, role: existingUser.role } : "Not found");

        if (existingUser?.role) {
          console.log("User already has role:", existingUser.role);
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Role has already been set and cannot be changed"
          });
        }

        // Single operation to create/update user with role
        console.log("Setting user role to:", input.role);
        const user = await User.findOneAndUpdate(
          { id: userId },
          {
            $set: {
              role: input.role,
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
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to update user role"
          });
        }

        console.log("Role set successful");
        // Return a properly structured response
        return {
          success: true,
          role: user.role
        };
      } catch (error) {
        console.error("Error in setRole mutation:", error);
        console.error("Error details:", {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });

        if (error instanceof TRPCError) {
          throw error;
        }

        // Handle database connection errors
        if (error.name === "MongooseError" || error.name === "MongoError") {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database connection error. Please try again later."
          });
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to set user role: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    }),

  // Get user role
  getRole: protectedProcedure
    .query(async ({ ctx }) => {
      console.log("getRole query called");

      try {
        console.log("Connecting to database...");
        await connectToDatabase();
        console.log("Connected to database successfully");

        const userId = ctx.session?.userId;
        console.log("User ID from session:", userId);

        if (!userId) {
          console.log("No user ID found in session");
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        console.log("Fetching user with ID:", userId);
        const user = await User.findOne({ id: userId });
        console.log("User found:", user ? { id: user.id, role: user.role } : "Not found");

        if (!user) {
          console.log("User not found in database");
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found"
          });
        }

        const role = user.role || "user";
        console.log("Returning role:", role);
        return role;
      } catch (error) {
        console.error("Error getting user role:", error);
        console.error("Error details:", {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });

        if (error instanceof TRPCError) {
          throw error;
        }

        // Handle database connection errors
        if (error.name === "MongooseError" || error.name === "MongoError") {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database connection error. Please try again later."
          });
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get user role"
        });
      }
    }),

  // Update user role
  updateRole: protectedProcedure
    .input(z.object({
      role: z.enum(["user", "admin", "super_admin"])
    }).optional().or(z.undefined()).transform(val => {
      // Provide default values if input is undefined
      if (!val) {
        console.log("Input is undefined, using default role 'user'");
        return { role: "user" };
      }
      return val;
    }))
    .mutation(async ({ ctx, input }) => {
      console.log("updateRole mutation called with:", { role: input.role });

      try {
        console.log("Connecting to database...");
        await connectToDatabase();
        console.log("Connected to database successfully");

        const userId = ctx.session?.userId;
        console.log("User ID from session:", userId);

        if (!userId) {
          console.log("No user ID found in session");
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        // Check if user already has a role
        console.log("Checking if user exists:", userId);
        const existingUser = await User.findOne({ id: userId });
        console.log("Existing user:", existingUser ? { id: existingUser.id, role: existingUser.role } : "Not found");

        if (existingUser?.role) {
          console.log("User already has role:", existingUser.role);
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Role has already been set and cannot be changed"
          });
        }

        console.log("Updating user role to:", input.role);
        const updateResult = await User.findOneAndUpdate(
          { id: userId },
          {
            $set: {
              role: input.role,
              updatedAt: new Date()
            },
            $setOnInsert: {
              id: userId,
              createdAt: new Date()
            }
          },
          { upsert: true, new: true }
        );

        console.log("Update result:", updateResult ? { id: updateResult.id, role: updateResult.role } : "No result");

        console.log("Role update successful");
        // Return a properly structured response
        return {
          success: true,
          role: input.role
        };
      } catch (error) {
        console.error("Error updating user role:", error);
        console.error("Error details:", {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });

        if (error instanceof TRPCError) {
          throw error;
        }

        // Handle database connection errors
        if (error.name === "MongooseError" || error.name === "MongoError") {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database connection error. Please try again later."
          });
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to update user role"
        });
      }
    })
});
