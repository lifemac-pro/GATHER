import { z } from "zod";

export const UserSchema = z.object({
  _id: z.string().optional(),
  userId: z.string(), // Clerk user ID
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  profileImage: z.string().optional(),
  bio: z.string().optional(),
  organization: z.string().optional(),
  jobTitle: z.string().optional(),
  phoneNumber: z.string().optional(),
  notificationPreferences: z
    .object({
      email: z.boolean().default(true),
      inApp: z.boolean().default(true),
      eventReminders: z.boolean().default(true),
      surveyNotifications: z.boolean().default(true),
    })
    .default({
      email: true,
      inApp: true,
      eventReminders: true,
      surveyNotifications: true,
    }),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type User = z.infer<typeof UserSchema>;

export const UserCollection = "users";
