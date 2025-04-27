import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/api/trpc";
import { RegistrationForm, RegistrationSubmission, Event, Attendee } from "@/server/db/models";
import { nanoid } from "nanoid";
import { TRPCError } from "@trpc/server";
import { connectToDatabase } from "@/server/db/mongo";

// Define Zod schemas for validation
const fieldResponseSchema = z.object({
  fieldId: z.string(),
  fieldLabel: z.string(),
  value: z.any(),
  fileUrl: z.string().optional(),
});

const sectionResponseSchema = z.object({
  sectionId: z.string(),
  sectionTitle: z.string(),
  fields: z.array(fieldResponseSchema),
});

// Create the router
export const registrationSubmissionRouter = createTRPCRouter({
  // Submit a registration form
  submit: publicProcedure
    .input(
      z.object({
        formId: z.string(),
        eventId: z.string(),
        userId: z.string(),
        sections: z.array(sectionResponseSchema),
      }),
    )
    .mutation(async ({ input }) => {
      // Ensure MongoDB is connected
      await connectToDatabase();

      // Verify the form exists
      const form = await RegistrationForm.findOne({ id: input.formId });
      if (!form) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Registration form not found",
        });
      }

      // Verify the event exists
      const event = await Event.findOne({ id: input.eventId });
      if (!event) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
      }

      // Check if registration is open
      if (form.startDate && new Date(form.startDate) > new Date()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Registration is not yet open for this event",
        });
      }

      if (form.endDate && new Date(form.endDate) < new Date()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Registration has closed for this event",
        });
      }

      // Check if max registrations has been reached
      if (form.maxRegistrations) {
        const currentRegistrations = await RegistrationSubmission.countDocuments({
          formId: input.formId,
          status: { $in: ["approved", "confirmed", "pending"] },
        });

        if (currentRegistrations >= form.maxRegistrations) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "This event has reached its maximum number of registrations",
          });
        }
      }

      // Check if user has already registered
      const existingSubmission = await RegistrationSubmission.findOne({
        formId: input.formId,
        userId: input.userId,
        status: { $in: ["approved", "confirmed", "pending"] },
      });

      if (existingSubmission) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You have already registered for this event",
        });
      }

      // Create the submission
      const submission = await RegistrationSubmission.create({
        id: nanoid(),
        ...input,
        status: form.requiresApproval ? "pending" : "confirmed",
        paymentStatus: form.collectPayment ? "pending" : "not_required",
        submittedAt: new Date(),
      });

      // If no approval required and no payment required, create attendee record
      if (!form.requiresApproval && !form.collectPayment) {
        // Extract name and email from submission
        let name = "";
        let email = "";

        for (const section of input.sections) {
          for (const field of section.fields) {
            if (field.fieldLabel.toLowerCase().includes("name")) {
              name = String(field.value);
            }
            if (field.fieldLabel.toLowerCase().includes("email")) {
              email = String(field.value);
            }
          }
        }

        // Create attendee record
        const attendee = await Attendee.create({
          id: nanoid(),
          eventId: input.eventId,
          userId: input.userId,
          name,
          email,
          registrationId: submission.id,
          status: "confirmed",
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // Update submission with attendee ID
        await RegistrationSubmission.updateOne(
          { id: submission.id },
          { $set: { attendeeId: attendee.id } },
        );
      }

      return submission;
    }),

  // Get a submission by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      // Ensure MongoDB is connected
      await connectToDatabase();

      // Get user ID from session
      const userId = ctx.session?.userId;
      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      // Find the submission
      const submission = await RegistrationSubmission.findOne({ id: input.id });
      if (!submission) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Registration submission not found",
        });
      }

      // Check if user is the owner or event admin
      const event = await Event.findOne({ id: submission.eventId });
      if (!event) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
      }

      if (submission.userId !== userId && event.createdById !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to view this submission",
        });
      }

      return submission;
    }),

  // Get all submissions for an event
  getByEvent: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        status: z.enum(["pending", "approved", "rejected", "cancelled", "confirmed"]).optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
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

      // Verify the user has permission to view submissions for this event
      if (event.createdById !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to view submissions for this event",
        });
      }

      // Build query
      const query: Record<string, unknown> = { eventId: input.eventId };
      if (input.status) {
        query.status = input.status;
      }

      // Get submissions
      return await RegistrationSubmission.find(query).sort({ submittedAt: -1 });
    }),

  // Get all submissions for a user
  getByUser: protectedProcedure
    .input(z.object({ userId: z.string().optional() }))
    .query(async ({ input, ctx }) => {
      // Ensure MongoDB is connected
      await connectToDatabase();

      // Get user ID from session
      const userId = ctx.session?.userId;
      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      // Use provided userId or default to session user
      const targetUserId = input.userId || userId;

      // Only allow admins to view other users' submissions
      if (targetUserId !== userId) {
        // Check if user is an admin (simplified check - implement proper role check)
        const isAdmin = false; // Replace with actual admin check
        if (!isAdmin) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to view other users' submissions",
          });
        }
      }

      // Get submissions
      return await RegistrationSubmission.find({ userId: targetUserId }).sort({
        submittedAt: -1,
      });
    }),

  // Update submission status (approve, reject, cancel)
  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["approved", "rejected", "cancelled", "confirmed"]),
        notes: z.string().optional(),
        rejectionReason: z.string().optional(),
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

      // Find the submission
      const submission = await RegistrationSubmission.findOne({ id: input.id });
      if (!submission) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Registration submission not found",
        });
      }

      // Verify the event exists
      const event = await Event.findOne({ id: submission.eventId });
      if (!event) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
      }

      // Check if user is the owner or event admin
      const isEventAdmin = event.createdById === userId;
      const isOwner = submission.userId === userId;

      // Only event admins can approve/reject, owners can cancel
      if (input.status === "cancelled") {
        if (!isOwner && !isEventAdmin) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to cancel this registration",
          });
        }
      } else if (!isEventAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to update this registration status",
        });
      }

      // Update data
      const updateData: Record<string, unknown> = {
        status: input.status,
      };

      if (input.notes) {
        updateData.notes = input.notes;
      }

      if (input.status === "approved") {
        updateData.approvedAt = new Date();
        updateData.approvedById = userId;
      } else if (input.status === "rejected") {
        updateData.rejectedAt = new Date();
        updateData.rejectedById = userId;
        if (input.rejectionReason) {
          updateData.rejectionReason = input.rejectionReason;
        }
      } else if (input.status === "confirmed") {
        updateData.confirmedAt = new Date();
      }

      // Update the submission
      const updatedSubmission = await RegistrationSubmission.findOneAndUpdate(
        { id: input.id },
        { $set: updateData },
        { new: true },
      );

      // If approved or confirmed, create or update attendee record
      if (input.status === "approved" || input.status === "confirmed") {
        // Extract name and email from submission
        let name = "";
        let email = "";

        for (const section of submission.sections) {
          for (const field of section.fields) {
            if (field.fieldLabel.toLowerCase().includes("name")) {
              name = String(field.value);
            }
            if (field.fieldLabel.toLowerCase().includes("email")) {
              email = String(field.value);
            }
          }
        }

        // Check if attendee already exists
        let attendee = await Attendee.findOne({ registrationId: submission.id });

        if (attendee) {
          // Update existing attendee
          await Attendee.updateOne(
            { id: attendee.id },
            {
              $set: {
                status: input.status,
                name,
                email,
                updatedAt: new Date(),
              },
            },
          );
        } else {
          // Create new attendee
          attendee = await Attendee.create({
            id: nanoid(),
            eventId: submission.eventId,
            userId: submission.userId,
            name,
            email,
            registrationId: submission.id,
            status: input.status,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          // Update submission with attendee ID
          await RegistrationSubmission.updateOne(
            { id: submission.id },
            { $set: { attendeeId: attendee.id } },
          );
        }
      } else if (input.status === "rejected" || input.status === "cancelled") {
        // If rejected or cancelled, update attendee status or remove attendee
        const attendee = await Attendee.findOne({ registrationId: submission.id });
        if (attendee) {
          await Attendee.updateOne(
            { id: attendee.id },
            { $set: { status: "cancelled", updatedAt: new Date() } },
          );
        }
      }

      return updatedSubmission;
    }),

  // Get registration statistics for an event
  getStats: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input, ctx }) => {
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

      // Verify the user has permission to view stats for this event
      if (event.createdById !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to view stats for this event",
        });
      }

      // Get counts by status
      const statusCounts = await RegistrationSubmission.aggregate([
        { $match: { eventId: input.eventId } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]);

      // Get counts by day
      const submissionsByDay = await RegistrationSubmission.aggregate([
        { $match: { eventId: input.eventId } },
        {
          $group: {
            _id: {
              year: { $year: "$submittedAt" },
              month: { $month: "$submittedAt" },
              day: { $dayOfMonth: "$submittedAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
      ]);

      // Format the results
      const statusCountsMap: Record<string, number> = {};
      statusCounts.forEach((item) => {
        statusCountsMap[item._id] = item.count;
      });

      const dailySubmissions = submissionsByDay.map((item) => ({
        date: new Date(item._id.year, item._id.month - 1, item._id.day).toISOString().split("T")[0],
        count: item.count,
      }));

      // Get total registrations
      const totalRegistrations = await RegistrationSubmission.countDocuments({
        eventId: input.eventId,
      });

      // Get active registrations (confirmed or approved)
      const activeRegistrations = await RegistrationSubmission.countDocuments({
        eventId: input.eventId,
        status: { $in: ["confirmed", "approved"] },
      });

      return {
        totalRegistrations,
        activeRegistrations,
        statusCounts: statusCountsMap,
        dailySubmissions,
      };
    }),
});
