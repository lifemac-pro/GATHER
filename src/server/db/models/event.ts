import { z } from "zod";

export const EventSchema = z.object({
  _id: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  date: z.string(),
  location: z.string().optional(),
  image: z.string().default("/images/tech-conference.jpg"),
  capacity: z.number().default(100),
  createdAt: z.date().default(() => new Date()),
  createdBy: z.string(),
  attendees: z.array(z.string()).default([]),
});

export type Event = z.infer<typeof EventSchema>;

export const EventCollection = "events";
