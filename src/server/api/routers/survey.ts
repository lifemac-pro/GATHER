import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import clientPromise from "@/server/db/mongodb";
import {
  SurveySchema,
  SurveyResponseSchema,
  SurveyCollection,
  SurveyResponseCollection,
} from "@/server/db/models/survey";
import { ObjectId } from "mongodb";

export const surveyRouter = createTRPCRouter({
  // Get all surveys
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const client = await clientPromise;
    const db = client.db();
    const surveys = await db
      .collection(SurveyCollection)
      .find()
      .sort({ createdAt: -1 })
      .toArray();
    return surveys;
  }),

  // Get survey by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const client = await clientPromise;
      const db = client.db();

      if (!ObjectId.isValid(input.id)) {
        throw new Error(`Invalid survey ID format: ${input.id}`);
      }

      const survey = await db
        .collection(SurveyCollection)
        .findOne({ _id: new ObjectId(input.id) });

      if (!survey) {
        throw new Error(`Survey not found: ${input.id}`);
      }

      return survey;
    }),

  // Create new survey
  create: protectedProcedure
    .input(SurveySchema.omit({ _id: true }))
    .mutation(async ({ input, ctx }) => {
      const client = await clientPromise;
      const db = client.db();

      const result = await db.collection(SurveyCollection).insertOne({
        ...input,
        createdBy: ctx.userId,
        createdAt: new Date(),
      });

      return { ...input, _id: result.insertedId.toString() };
    }),

  // Update survey
  update: protectedProcedure
    .input(SurveySchema)
    .mutation(async ({ input, ctx }) => {
      const { _id, ...updateData } = input;

      // Check if _id exists and validate ObjectId format
      if (!_id) {
        throw new Error("Survey ID is required for updates");
      }

      if (!ObjectId.isValid(_id)) {
        throw new Error(`Invalid survey ID format: ${_id}`);
      }

      const client = await clientPromise;
      const db = client.db();

      // Check if user owns the survey
      const survey = await db
        .collection(SurveyCollection)
        .findOne({ _id: new ObjectId(_id) });

      if (!survey) {
        throw new Error(`Survey not found: ${_id}`);
      }

      if (survey.createdBy !== ctx.userId) {
        throw new Error("You don't have permission to update this survey");
      }

      await db
        .collection(SurveyCollection)
        .updateOne({ _id: new ObjectId(_id) }, { $set: updateData });

      return input;
    }),

  // Delete survey
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (!ObjectId.isValid(input.id)) {
        throw new Error(`Invalid survey ID format: ${input.id}`);
      }

      const client = await clientPromise;
      const db = client.db();

      // Check if user owns the survey
      const survey = await db
        .collection(SurveyCollection)
        .findOne({ _id: new ObjectId(input.id) });

      if (!survey) {
        throw new Error(`Survey not found: ${input.id}`);
      }

      if (survey.createdBy !== ctx.userId) {
        throw new Error("You don't have permission to delete this survey");
      }

      await db
        .collection(SurveyCollection)
        .deleteOne({ _id: new ObjectId(input.id) });

      // Also delete all responses to this survey
      await db
        .collection(SurveyResponseCollection)
        .deleteMany({ surveyId: input.id });

      return { success: true };
    }),

  // Submit survey response
  submitResponse: protectedProcedure
    .input(SurveyResponseSchema.omit({ _id: true, submittedAt: true }))
    .mutation(async ({ input, ctx }) => {
      const client = await clientPromise;
      const db = client.db();

      // Check if survey exists
      if (!ObjectId.isValid(input.surveyId)) {
        throw new Error(`Invalid survey ID format: ${input.surveyId}`);
      }

      const survey = await db
        .collection(SurveyCollection)
        .findOne({ _id: new ObjectId(input.surveyId) });

      if (!survey) {
        throw new Error(`Survey not found: ${input.surveyId}`);
      }

      // Check if user has already submitted a response
      const existingResponse = await db
        .collection(SurveyResponseCollection)
        .findOne({
          surveyId: input.surveyId,
          userId: ctx.userId,
        });

      if (existingResponse) {
        throw new Error("You have already submitted a response to this survey");
      }

      // Insert response
      const result = await db.collection(SurveyResponseCollection).insertOne({
        ...input,
        userId: ctx.userId,
        submittedAt: new Date(),
      });

      return {
        ...input,
        _id: result.insertedId.toString(),
        submittedAt: new Date(),
      };
    }),

  // Get surveys for current user (that they haven't responded to yet)
  getAvailableSurveys: protectedProcedure.query(async ({ ctx }) => {
    const client = await clientPromise;
    const db = client.db();

    // Get all active surveys
    const allSurveys = await db
      .collection(SurveyCollection)
      .find({ isActive: true })
      .toArray();

    // Get all survey responses by this user
    const userResponses = await db
      .collection(SurveyResponseCollection)
      .find({ userId: ctx.userId })
      .toArray();

    // Get the IDs of surveys the user has already responded to
    const respondedSurveyIds = userResponses.map(
      (response) => response.surveyId,
    );

    // Filter out surveys the user has already responded to
    const availableSurveys = allSurveys.filter(
      (survey) => !respondedSurveyIds.includes(survey._id.toString()),
    );

    return availableSurveys;
  }),

  // Get surveys the user has already responded to
  getCompletedSurveys: protectedProcedure.query(async ({ ctx }) => {
    const client = await clientPromise;
    const db = client.db();

    // Get all survey responses by this user
    const userResponses = await db
      .collection(SurveyResponseCollection)
      .find({ userId: ctx.userId })
      .toArray();

    // Get the IDs of surveys the user has already responded to
    const respondedSurveyIds = userResponses.map(
      (response) => response.surveyId,
    );

    // If user hasn't responded to any surveys, return empty array
    if (respondedSurveyIds.length === 0) {
      return [];
    }

    // Get the surveys the user has responded to
    const completedSurveys = await db
      .collection(SurveyCollection)
      .find({
        _id: {
          $in: respondedSurveyIds.map((id) =>
            ObjectId.isValid(id) ? new ObjectId(id) : id,
          ),
        },
      })
      .toArray();

    return completedSurveys;
  }),

  // Check if user has responded to a specific survey
  hasResponded: protectedProcedure
    .input(z.object({ surveyId: z.string() }))
    .query(async ({ input, ctx }) => {
      const client = await clientPromise;
      const db = client.db();

      const response = await db.collection(SurveyResponseCollection).findOne({
        surveyId: input.surveyId,
        userId: ctx.userId,
      });

      return !!response;
    }),

  // Get survey responses (admin only)
  getResponses: protectedProcedure
    .input(z.object({ surveyId: z.string() }))
    .query(async ({ input, ctx }) => {
      const client = await clientPromise;
      const db = client.db();

      // Check if survey exists and user is the creator
      if (!ObjectId.isValid(input.surveyId)) {
        throw new Error(`Invalid survey ID format: ${input.surveyId}`);
      }

      const survey = await db
        .collection(SurveyCollection)
        .findOne({ _id: new ObjectId(input.surveyId) });

      if (!survey) {
        throw new Error(`Survey not found: ${input.surveyId}`);
      }

      if (survey.createdBy !== ctx.userId) {
        throw new Error(
          "You don't have permission to view responses to this survey",
        );
      }

      // Get all responses for this survey
      const responses = await db
        .collection(SurveyResponseCollection)
        .find({ surveyId: input.surveyId })
        .toArray();

      return responses;
    }),
});
