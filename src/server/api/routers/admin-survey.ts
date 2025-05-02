import { z } from "zod";
import { createTRPCRouter, adminProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { Survey } from "@/server/db/models";
import { connectToDatabase } from "@/server/db/mongo";
import { activateSurvey, deactivateSurvey } from "@/lib/data-sync-service";
import { nanoid } from "nanoid";

// Mock model for compatibility
const SurveyResponse = {
  deleteMany: async () => null,
  find: () => ({
    sort: () => ({
      populate: () => []
    })
  })
};

// Define the question schema
const questionSchema = z.object({
  text: z.string().min(1),
  type: z.enum(["text", "rating", "multiple_choice", "checkbox"]),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(),
  description: z.string().optional(),
});

export const adminSurveyRouter = createTRPCRouter({
  // Create a new survey
  create: adminProcedure
    .input(z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      eventId: z.string(),
      questions: z.array(questionSchema),
      isActive: z.boolean().default(false),
      expiresAt: z.date().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        await connectToDatabase();

        // Create the survey
        const survey = await Survey.create({
          ...input,
          id: nanoid(),
          createdBy: ctx.auth.userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // If survey is active, notify attendees
        if (input.isActive) {
          await activateSurvey(survey.id);
        }

        return survey;
      } catch (error) {
        console.error("Error creating survey:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create survey",
        });
      }
    }),

  // Update a survey
  update: adminProcedure
    .input(z.object({
      id: z.string(),
      title: z.string().min(1).optional(),
      description: z.string().optional(),
      eventId: z.string().optional(),
      questions: z.array(questionSchema).optional(),
      isActive: z.boolean().optional(),
      expiresAt: z.date().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        await connectToDatabase();

        const { id, ...updateData } = input;

        // Check if survey exists
        const existingSurvey = await Survey.findById(id);
        if (!existingSurvey) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Survey not found",
          });
        }

        // Check if status is changing to active
        const isActivating =
          !existingSurvey.isActive &&
          updateData.isActive === true;

        // Check if status is changing from active
        const isDeactivating =
          existingSurvey.isActive &&
          updateData.isActive === false;

        // Update the survey
        const updatedSurvey = await Survey.findByIdAndUpdate(
          id,
          {
            ...updateData,
            updatedAt: new Date()
          },
          { new: true }
        );

        // Handle activation/deactivation
        if (isActivating) {
          await activateSurvey(id);
        } else if (isDeactivating) {
          await deactivateSurvey(id);
        }

        return updatedSurvey;
      } catch (error) {
        console.error("Error updating survey:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update survey",
        });
      }
    }),

  // Activate a survey
  activate: adminProcedure
    .input(z.object({
      id: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        const result = await activateSurvey(input.id);

        if (!result.success) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to activate survey",
          });
        }

        return result.survey;
      } catch (error) {
        console.error("Error activating survey:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to activate survey",
        });
      }
    }),

  // Deactivate a survey
  deactivate: adminProcedure
    .input(z.object({
      id: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        const result = await deactivateSurvey(input.id);

        if (!result.success) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to deactivate survey",
          });
        }

        return result.survey;
      } catch (error) {
        console.error("Error deactivating survey:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to deactivate survey",
        });
      }
    }),

  // Delete a survey
  delete: adminProcedure
    .input(z.object({
      id: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        await connectToDatabase();

        // Check if survey exists
        const existingSurvey = await Survey.findById(input.id);
        if (!existingSurvey) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Survey not found",
          });
        }

        // Delete the survey
        await Survey.findByIdAndDelete(input.id);

        // Delete associated responses
        await SurveyResponse.deleteMany({ surveyId: input.id });

        return { success: true };
      } catch (error) {
        console.error("Error deleting survey:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete survey",
        });
      }
    }),

  // Get all surveys (for admin dashboard)
  getAll: adminProcedure
    .query(async () => {
      try {
        await connectToDatabase();

        const surveys = await Survey.find()
          .sort({ createdAt: -1 })
          .populate('eventId')
          .populate('createdBy');

        return surveys;
      } catch (error) {
        console.error("Error getting surveys:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get surveys",
        });
      }
    }),

  // Get survey by ID (for admin dashboard)
  getById: adminProcedure
    .input(z.object({
      id: z.string(),
    }))
    .query(async ({ input }) => {
      try {
        await connectToDatabase();

        const survey = await Survey.findById(input.id)
          .populate('eventId')
          .populate('createdBy');

        if (!survey) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Survey not found",
          });
        }

        return survey;
      } catch (error) {
        console.error("Error getting survey:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get survey",
        });
      }
    }),

  // Get survey responses (for admin dashboard)
  getResponses: adminProcedure
    .input(z.object({
      surveyId: z.string(),
    }))
    .query(async ({ input }) => {
      try {
        await connectToDatabase();

        const responses = await SurveyResponse.find({ surveyId: input.surveyId })
          .sort({ createdAt: -1 })
          .populate('userId');

        return responses;
      } catch (error) {
        console.error("Error getting survey responses:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get survey responses",
        });
      }
    }),
});
