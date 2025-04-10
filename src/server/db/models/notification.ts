import { z } from "zod";

export const NotificationSchema = z.object({
  _id: z.string().optional(),
  userId: z.string().optional(), // Optional for global notifications
  title: z.string().min(1),
  message: z.string().min(1),
  type: z.enum(["EVENT_UPDATE", "EVENT_REMINDER", "SURVEY_AVAILABLE", "REGISTRATION_CONFIRMATION"]),
  read: z.boolean().default(false),
  isGlobal: z.boolean().optional().default(false),
  readBy: z.array(z.string()).optional().default([]),
  createdAt: z.date().default(() => new Date()),
  eventId: z.string().optional(),
  link: z.string().optional(),
});

export type Notification = z.infer<typeof NotificationSchema>;

export const NotificationCollection = "notifications";