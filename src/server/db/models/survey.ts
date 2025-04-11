import { z } from "zod";

// Define the question type schema
export const SurveyQuestionSchema = z.object({
  id: z.string().optional(),
  text: z.string().min(1, "Question text is required"),
  type: z.enum(["MULTIPLE_CHOICE", "TEXT", "RATING", "YES_NO"]),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(),
});

// Define the survey schema
export const SurveySchema = z.object({
  _id: z.string().optional(),
  title: z.string().min(1, "Survey title is required"),
  description: z.string().min(1, "Survey description is required"),
  eventId: z.string().optional(),
  createdBy: z.string(),
  createdAt: z.date().default(() => new Date()),
  expiresAt: z.date().optional(),
  isActive: z.boolean().default(true),
  questions: z.array(SurveyQuestionSchema),
});

// Define the survey response schema
export const SurveyResponseSchema = z.object({
  _id: z.string().optional(),
  surveyId: z.string(),
  userId: z.string(),
  eventId: z.string().optional(),
  submittedAt: z.date().default(() => new Date()),
  answers: z.array(
    z.object({
      questionId: z.string(),
      answer: z.union([z.string(), z.array(z.string()), z.number()]),
    }),
  ),
});

export type SurveyQuestion = z.infer<typeof SurveyQuestionSchema>;
export type Survey = z.infer<typeof SurveySchema>;
export type SurveyResponse = z.infer<typeof SurveyResponseSchema>;

export const SurveyCollection = "surveys";
export const SurveyResponseCollection = "survey_responses";
