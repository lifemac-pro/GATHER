import { z } from "zod";

export const RegistrationSchema = z.object({
  _id: z.string().optional(),
  eventId: z.string(),
  userId: z.string(),
  userName: z.string(),
  userEmail: z.string().email(),
  registeredAt: z.date().default(() => new Date()),
  status: z.enum(["confirmed", "pending", "cancelled"]).default("confirmed"),
  notes: z.string().optional(),
});

export type Registration = z.infer<typeof RegistrationSchema>;

export const RegistrationCollection = "registrations";
