import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { Setting } from "@/server/db/models";

const emailSettingsSchema = z.object({
  smtpHost: z.string(),
  smtpPort: z.string(),
  smtpUser: z.string(),
  smtpPass: z.string(),
  fromEmail: z.string().email(),
  fromName: z.string(),
});

const generalSettingsSchema = z.object({
  siteName: z.string(),
  allowPublicRegistration: z.boolean(),
  requireEmailVerification: z.boolean(),
  maxEventsPerUser: z.string(),
  maxAttendeesPerEvent: z.string(),
  defaultTimeZone: z.string(),
});

const notificationSettingsSchema = z.object({
  enableEmailNotifications: z.boolean(),
  sendEventReminders: z.boolean(),
  reminderHours: z.string(),
  sendFeedbackRequests: z.boolean(),
  feedbackRequestDelay: z.string(),
});

export const settingsRouter = createTRPCRouter({
  get: publicProcedure
    .input(z.object({ type: z.enum(["email", "general", "notifications"]) }))
    .query(async ({ input }) => {
      const setting = await Setting.findOne({ type: input.type }).exec();
      return setting ? JSON.parse(setting.value) : null;
    }),

  update: publicProcedure
    .input(
      z.object({
        type: z.enum(["email", "general", "notifications"]),
        settings: z.union([
          emailSettingsSchema,
          generalSettingsSchema,
          notificationSettingsSchema,
        ]),
      }),
    )
    .mutation(async ({ input }) => {
      // Validate settings based on type
      switch (input.type) {
        case "email":
          emailSettingsSchema.parse(input.settings);
          break;
        case "general":
          generalSettingsSchema.parse(input.settings);
          break;
        case "notifications":
          notificationSettingsSchema.parse(input.settings);
          break;
      }

      // Update or create settings using upsert
      await Setting.findOneAndUpdate(
        { type: input.type },
        {
          $set: {
            type: input.type,
            value: JSON.stringify(input.settings),
          },
        },
        { upsert: true },
      ).exec();

      return { success: true };
    }),
});
