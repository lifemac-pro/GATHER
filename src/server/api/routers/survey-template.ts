import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { SurveyTemplate, Event } from "@/server/db/models";
import { nanoid } from "nanoid";
import { TRPCError } from "@trpc/server";
import { connectToDatabase } from "@/server/db/mongo";

const questionSchema = z.object({
  id: z.string().optional(),
  text: z.string().min(1, "Question text is required"),
  type: z.enum(["text", "rating", "multiple_choice", "checkbox", "dropdown"]),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(),
  order: z.number(),
});

export const surveyTemplateRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        name: z.string().min(1, "Name is required"),
        description: z.string().optional(),
        questions: z.array(questionSchema),
        isActive: z.boolean().default(true),
        sendTiming: z
          .enum(["after_event", "during_event", "custom"])
          .default("after_event"),
        sendDelay: z.number().optional(),
        sendTime: z.date().optional(),
        reminderEnabled: z.boolean().default(false),
        reminderDelay: z.number().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Ensure MongoDB is connected
      await connectToDatabase();

      // Get user ID from session
      const userId = ctx.session?.userId;
      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      // Verify the event exists
      const event = await Event.findOne({ id: input.eventId });
      if (!event) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
      }

      // Verify the user has permission to create a survey for this event
      if (event.createdById !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "You don't have permission to create a survey for this event",
        });
      }

      // Process questions to ensure they have IDs
      const questions = input.questions.map((q) => ({
        ...q,
        id: q.id ?? nanoid(),
      }));

      console.log("Creating survey template with data:", {
        eventId: input.eventId,
        name: input.name,
        questionCount: questions.length,
        createdById: userId,
      });

      try {
        // Create survey template
        const surveyTemplate = await SurveyTemplate.create({
          id: nanoid(),
          ...input,
          questions,
          createdById: userId,
        });

        console.log("Survey template created successfully:", {
          id: surveyTemplate.id,
          name: surveyTemplate.name,
        });

        return surveyTemplate;
      } catch (error) {
        console.error("Error creating survey template:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create survey template",
          cause: error,
        });
      }
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1, "Name is required").optional(),
        description: z.string().optional(),
        questions: z.array(questionSchema).optional(),
        isActive: z.boolean().optional(),
        sendTiming: z
          .enum(["after_event", "during_event", "custom"])
          .optional(),
        sendDelay: z.number().optional(),
        sendTime: z.date().optional(),
        reminderEnabled: z.boolean().optional(),
        reminderDelay: z.number().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Ensure MongoDB is connected
      await connectToDatabase();

      // Get user ID from session
      const userId = ctx.session?.userId;
      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      // Find the template
      const template = await SurveyTemplate.findOne({ id: input.id });
      if (!template) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Survey template not found",
        });
      }

      // Verify the user has permission to update this template
      if (template.createdById !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to update this survey template",
        });
      }

      // Process questions if provided
      const updateData = { ...input } as Record<string, unknown>;
      if (input.questions) {
        updateData.questions = input.questions.map((q) => ({
          ...q,
          id: q.id ?? nanoid(),
        }));
      }

      // Update the template
      const updatedTemplate = await SurveyTemplate.findOneAndUpdate(
        { id: input.id },
        { $set: updateData },
        { new: true },
      );

      return updatedTemplate;
    }),

  getByEvent: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input }) => {
      // Ensure MongoDB is connected
      await connectToDatabase();

      console.log("Fetching survey templates for event:", input.eventId);

      try {
        const templates = await SurveyTemplate.find({ eventId: input.eventId }).sort({
          createdAt: -1,
        });

        console.log("Found templates:", templates.length);
        return templates;
      } catch (error) {
        console.error("Error fetching survey templates:", error);
        return [];
      }
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      // Ensure MongoDB is connected
      await connectToDatabase();

      const template = await SurveyTemplate.findOne({ id: input.id });

      if (!template) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Survey template not found",
        });
      }

      return template;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Ensure MongoDB is connected
      await connectToDatabase();

      // Get user ID from session
      const userId = ctx.session?.userId;
      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      // Find the template
      const template = await SurveyTemplate.findOne({ id: input.id });
      if (!template) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Survey template not found",
        });
      }

      // Verify the user has permission to delete this template
      if (template.createdById !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to delete this survey template",
        });
      }

      // Delete the template
      await SurveyTemplate.deleteOne({ id: input.id });

      return { success: true };
    }),

  // Send a survey immediately to all attendees
  sendNow: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Ensure MongoDB is connected
      await connectToDatabase();

      // Get user ID from session
      const userId = ctx.session?.userId;
      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      // Find the template
      const template = await SurveyTemplate.findOne({ id: input.id });
      if (!template) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Survey template not found",
        });
      }

      // Verify the user has permission to send this survey
      if (template.createdById !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to send this survey",
        });
      }

      // Get the event
      const event = await Event.findOne({ id: template.eventId });
      if (!event) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
      }

      // Import and call the survey scheduler function
      const surveyScheduler = await import("@/lib/survey-scheduler");
      await surveyScheduler.sendSurveysForTemplate(template, event);

      // Also create in-app notifications for attendees
      const { Attendee, User } = await import("@/server/db/models");
      const { createNotification } = await import("@/lib/notification-service");

      // Get all attendees for this event
      const attendees = await Attendee.find({
        eventId: template.eventId,
        status: { $in: ["attended", "checked-in"] },
      });

      console.log(`Sending notifications to ${attendees.length} attendees for survey: ${template.name}`);

      // Send notification to each attendee
      for (const attendee of attendees) {
        try {
          await createNotification({
            userId: attendee.userId,
            type: "survey",
            title: "New Survey Available",
            message: `Please complete the survey for "${event.name}".`,
            eventId: template.eventId,
            actionUrl: `/attendee/surveys/${template.id}`,
            actionLabel: "Take Survey",
          });

          console.log(`Notification sent to attendee: ${attendee.userId}`);
        } catch (error) {
          console.error(`Error sending notification to attendee ${attendee.userId}:`, error);
        }
      }

      return { success: true };
    }),
});
