import { z } from "zod";

export const UserSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  email: z.string().email(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export const EventSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  date: z.date(),
  location: z.string().optional(),
  organizerId: z.string(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export const AttendeeSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  userId: z.string(),
  status: z.enum(["confirmed", "pending", "declined"]),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type User = z.infer<typeof UserSchema>;
export type Event = z.infer<typeof EventSchema>;
export type Attendee = z.infer<typeof AttendeeSchema>; 