import { z } from "zod";

/**
 * Auth request types
 */
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

export const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

export const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm password is required"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type LoginRequest = z.infer<typeof loginSchema>;
export type SignupRequest = z.infer<typeof signupSchema>;
export type ResetPasswordRequest = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordRequest = z.infer<typeof changePasswordSchema>;

/**
 * Event request types
 */
export const createEventSchema = z.object({
  name: z.string().min(3, "Event name must be at least 3 characters"),
  description: z.string().optional(),
  location: z.string().optional(),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  category: z.string(),
  price: z.number().min(0).optional(),
  maxAttendees: z.number().int().positive().optional(),
  image: z.string().url().optional(),
});

export const updateEventSchema = z.object({
  name: z
    .string()
    .min(3, "Event name must be at least 3 characters")
    .optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  startDate: z.string().or(z.date()).optional(),
  endDate: z.string().or(z.date()).optional(),
  category: z.string().optional(),
  price: z.number().min(0).optional(),
  maxAttendees: z.number().int().positive().optional(),
  image: z.string().url().optional(),
  featured: z.boolean().optional(),
  status: z.enum(["draft", "published", "cancelled", "completed"]).optional(),
});

export const listEventsQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10)),
  category: z.string().optional(),
  featured: z
    .string()
    .optional()
    .transform((val) => val === "true"),
  upcoming: z
    .string()
    .optional()
    .transform((val) => val === "true"),
});

export type CreateEventRequest = z.infer<typeof createEventSchema>;
export type UpdateEventRequest = z.infer<typeof updateEventSchema>;
export type ListEventsQuery = z.infer<typeof listEventsQuerySchema>;

/**
 * Attendee request types
 */
export const registerForEventSchema = z.object({
  eventId: z.string().min(1, "Event ID is required"),
  paymentIntentId: z.string().optional(),
});

export const checkInAttendeeSchema = z.object({
  attendeeId: z.string().min(1, "Attendee ID is required"),
});

export const cancelRegistrationSchema = z.object({
  attendeeId: z.string().min(1, "Attendee ID is required"),
  reason: z.string().optional(),
});

export const listAttendeesQuerySchema = z.object({
  eventId: z.string().optional(),
  status: z
    .enum(["registered", "attended", "cancelled", "waitlisted"])
    .optional(),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10)),
});

export type RegisterForEventRequest = z.infer<typeof registerForEventSchema>;
export type CheckInAttendeeRequest = z.infer<typeof checkInAttendeeSchema>;
export type CancelRegistrationRequest = z.infer<
  typeof cancelRegistrationSchema
>;
export type ListAttendeesQuery = z.infer<typeof listAttendeesQuerySchema>;

/**
 * Survey request types
 */
export const submitSurveySchema = z.object({
  eventId: z.string().min(1, "Event ID is required"),
  rating: z.number().min(1).max(5),
  feedback: z.string().optional(),
  responses: z
    .array(
      z.object({
        question: z.string(),
        answer: z.string(),
      }),
    )
    .optional(),
});

export type SubmitSurveyRequest = z.infer<typeof submitSurveySchema>;

/**
 * Waitlist request types
 */
export const joinWaitlistSchema = z.object({
  eventId: z.string().min(1, "Event ID is required"),
});

export const processWaitlistSchema = z.object({
  eventId: z.string().min(1, "Event ID is required"),
  count: z.number().int().positive(),
});

export type JoinWaitlistRequest = z.infer<typeof joinWaitlistSchema>;
export type ProcessWaitlistRequest = z.infer<typeof processWaitlistSchema>;

/**
 * Chat request types
 */
export const sendChatMessageSchema = z.object({
  eventId: z.string().min(1, "Event ID is required"),
  message: z.string().min(1, "Message is required"),
  type: z.enum(["text", "announcement", "system"]).optional(),
});

export const listChatMessagesQuerySchema = z.object({
  eventId: z.string().min(1, "Event ID is required"),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20)),
  cursor: z.string().optional(),
});

export type SendChatMessageRequest = z.infer<typeof sendChatMessageSchema>;
export type ListChatMessagesQuery = z.infer<typeof listChatMessagesQuerySchema>;

/**
 * Notification request types
 */
export const markNotificationsAsReadSchema = z.object({
  notificationIds: z.array(z.string()),
});

export const listNotificationsQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20)),
  cursor: z.string().optional(),
  type: z.enum(["event", "system", "chat", "reminder"]).optional(),
});

export type MarkNotificationsAsReadRequest = z.infer<
  typeof markNotificationsAsReadSchema
>;
export type ListNotificationsQuery = z.infer<
  typeof listNotificationsQuerySchema
>;

/**
 * User profile request types
 */
export const updateProfileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  profileImage: z.string().url().optional(),
});

export type UpdateProfileRequest = z.infer<typeof updateProfileSchema>;
