import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import clientPromise from "@/server/db/mongodb";
import { UserSchema, UserCollection } from "@/server/db/models/user";
import { ObjectId } from "mongodb";

export const userRouter = createTRPCRouter({
  // Get current user profile
  getCurrentUser: protectedProcedure.query(async ({ ctx }) => {
    const client = await clientPromise;
    const db = client.db();

    // Find user by Clerk userId
    const user = await db
      .collection(UserCollection)
      .findOne({ userId: ctx.userId });

    if (!user) {
      // If user doesn't exist, create a default profile
      const defaultUser = {
        userId: ctx.userId,
        fullName: "",
        email: "",
        notificationPreferences: {
          email: true,
          inApp: true,
          eventReminders: true,
          surveyNotifications: true,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Insert the default user
      const result = await db.collection(UserCollection).insertOne(defaultUser);

      return {
        ...defaultUser,
        _id: result.insertedId.toString(),
      };
    }

    // Convert ObjectId to string
    return {
      ...user,
      _id: user._id.toString(),
    };
  }),

  // Update user profile
  updateProfile: protectedProcedure
    .input(
      z.object({
        fullName: z.string().min(1, "Full name is required"),
        email: z.string().email("Invalid email address"),
        bio: z.string().optional(),
        organization: z.string().optional(),
        jobTitle: z.string().optional(),
        phoneNumber: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const client = await clientPromise;
      const db = client.db();

      // Find user by Clerk userId
      const user = await db
        .collection(UserCollection)
        .findOne({ userId: ctx.userId });

      if (!user) {
        // If user doesn't exist, create a new profile
        const newUser = {
          userId: ctx.userId,
          ...input,
          notificationPreferences: {
            email: true,
            inApp: true,
            eventReminders: true,
            surveyNotifications: true,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const result = await db.collection(UserCollection).insertOne(newUser);

        return {
          ...newUser,
          _id: result.insertedId.toString(),
        };
      }

      // Update existing user
      const updatedUser = {
        ...user,
        ...input,
        updatedAt: new Date(),
      };

      await db.collection(UserCollection).updateOne(
        { userId: ctx.userId },
        {
          $set: {
            ...input,
            updatedAt: new Date(),
          },
        },
      );

      return {
        ...updatedUser,
        _id: user._id.toString(),
      };
    }),

  // Update notification preferences
  updateNotificationPreferences: protectedProcedure
    .input(
      z.object({
        email: z.boolean(),
        inApp: z.boolean(),
        eventReminders: z.boolean(),
        surveyNotifications: z.boolean(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const client = await clientPromise;
      const db = client.db();

      // Find user by Clerk userId
      const user = await db
        .collection(UserCollection)
        .findOne({ userId: ctx.userId });

      if (!user) {
        // If user doesn't exist, create a new profile with these preferences
        const newUser = {
          userId: ctx.userId,
          fullName: "",
          email: "",
          notificationPreferences: input,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const result = await db.collection(UserCollection).insertOne(newUser);

        return {
          ...newUser,
          _id: result.insertedId.toString(),
        };
      }

      // Update notification preferences
      await db.collection(UserCollection).updateOne(
        { userId: ctx.userId },
        {
          $set: {
            notificationPreferences: input,
            updatedAt: new Date(),
          },
        },
      );

      return {
        ...user,
        notificationPreferences: input,
        _id: user._id.toString(),
      };
    }),
});
