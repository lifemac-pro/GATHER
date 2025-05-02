import { z } from "zod";
import { createTRPCRouter, protectedProcedure, adminProcedure } from "@/server/api/trpc";
import { User } from "@/server/db/models";
import { TRPCError } from "@trpc/server";
import { connectToDatabase } from "@/server/db/mongo";

export const userRouter = createTRPCRouter({
  // Get current user
  getCurrentUser: protectedProcedure
    .query(async ({ ctx }) => {
      await connectToDatabase();

      const userId = ctx.session?.userId;
      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const user = await User.findOne({ id: userId });
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      };
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
      await connectToDatabase();

      try {
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

        return { success: true, user };
      } catch (error) {
        console.error("Error creating user:", error);
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
      await connectToDatabase();

      const userId = ctx.session?.userId;
      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        // Check if user already has a role
        const existingUser = await User.findOne({ id: userId });
        if (existingUser?.role) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Role has already been set and cannot be changed"
          });
        }

        // Single operation to create/update user with role
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

        if (!user) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to update user role"
          });
        }

        return { success: true, role: user.role };
      } catch (error) {
        console.error("Error in setRole mutation:", error);
        if (error instanceof TRPCError) {
          throw error;
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
      await connectToDatabase();

      const userId = ctx.session?.userId;
      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        const user = await User.findOne({ id: userId });
        if (!user) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found"
          });
        }

        return user.role || "user";
      } catch (error) {
        console.error("Error getting user role:", error);
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
    }))
    .mutation(async ({ ctx, input }) => {
      await connectToDatabase();
      
      const userId = ctx.session?.userId;
      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        // Check if user already has a role
        const existingUser = await User.findOne({ id: userId });
        if (existingUser?.role) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Role has already been set and cannot be changed"
          });
        }

        await User.findOneAndUpdate(
          { id: userId },
          { $set: { role: input.role } }
        );

        return { success: true };
      } catch (error) {
        console.error("Error updating user role:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update user role"
        });
      }
    })
});
