import { z } from "zod";
import { createTRPCRouter, adminProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { connectToDatabase } from "@/server/db/mongo";
import { activateRegistrationForm } from "@/lib/data-sync-service";
import { nanoid } from "nanoid";

// Mock models for compatibility
const RegistrationForm = {
  create: async () => ({ id: 'mock-id' }),
  findById: async () => null,
  findByIdAndUpdate: async () => null,
  findByIdAndDelete: async () => null,
  find: () => ({
    sort: () => ({
      populate: () => ({
        populate: () => []
      })
    })
  }),
  deleteMany: async () => null
};

const FormSubmission = {
  deleteMany: async () => null,
  find: () => ({
    sort: () => ({
      populate: () => []
    })
  })
};

// Define the field schema
const fieldSchema = z.object({
  label: z.string().min(1),
  type: z.enum(["text", "textarea", "email", "phone", "number", "date", "select", "radio", "checkbox"]),
  required: z.boolean().default(false),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
  options: z.array(z.string()).optional(),
});

// Define the section schema
const sectionSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  fields: z.array(fieldSchema),
});

export const adminRegistrationFormRouter = createTRPCRouter({
  // Create a new registration form
  create: adminProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      eventId: z.string(),
      sections: z.array(sectionSchema),
      isActive: z.boolean().default(false),
      requireApproval: z.boolean().default(false),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        await connectToDatabase();

        // Create the registration form
        const form = await RegistrationForm.create({
          ...input,
          id: nanoid(),
          createdBy: ctx.auth.userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // If form is active, deactivate other forms for this event
        if (input.isActive) {
          await activateRegistrationForm(form.id);
        }

        return form;
      } catch (error) {
        console.error("Error creating registration form:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create registration form",
        });
      }
    }),

  // Update a registration form
  update: adminProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      eventId: z.string().optional(),
      sections: z.array(sectionSchema).optional(),
      isActive: z.boolean().optional(),
      requireApproval: z.boolean().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        await connectToDatabase();

        const { id, ...updateData } = input;

        // Check if form exists
        const existingForm = await RegistrationForm.findById(id);
        if (!existingForm) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Registration form not found",
          });
        }

        // Check if status is changing to active
        const isActivating =
          !existingForm.isActive &&
          updateData.isActive === true;

        // Update the form
        const updatedForm = await RegistrationForm.findByIdAndUpdate(
          id,
          {
            ...updateData,
            updatedAt: new Date()
          },
          { new: true }
        );

        // Handle activation
        if (isActivating) {
          await activateRegistrationForm(id);
        }

        return updatedForm;
      } catch (error) {
        console.error("Error updating registration form:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update registration form",
        });
      }
    }),

  // Activate a registration form
  activate: adminProcedure
    .input(z.object({
      id: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        const result = await activateRegistrationForm(input.id);

        if (!result.success) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to activate registration form",
          });
        }

        return result.form;
      } catch (error) {
        console.error("Error activating registration form:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to activate registration form",
        });
      }
    }),

  // Delete a registration form
  delete: adminProcedure
    .input(z.object({
      id: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        await connectToDatabase();

        // Check if form exists
        const existingForm = await RegistrationForm.findById(input.id);
        if (!existingForm) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Registration form not found",
          });
        }

        // Delete the form
        await RegistrationForm.findByIdAndDelete(input.id);

        // Delete associated submissions
        await FormSubmission.deleteMany({ formId: input.id });

        return { success: true };
      } catch (error) {
        console.error("Error deleting registration form:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete registration form",
        });
      }
    }),

  // Get all registration forms (for admin dashboard)
  getAll: adminProcedure
    .query(async () => {
      try {
        await connectToDatabase();

        const forms = await RegistrationForm.find()
          .sort({ createdAt: -1 })
          .populate('eventId')
          .populate('createdBy');

        return forms;
      } catch (error) {
        console.error("Error getting registration forms:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get registration forms",
        });
      }
    }),

  // Get registration form by ID (for admin dashboard)
  getById: adminProcedure
    .input(z.object({
      id: z.string(),
    }))
    .query(async ({ input }) => {
      try {
        await connectToDatabase();

        const form = await RegistrationForm.findById(input.id)
          .populate('eventId')
          .populate('createdBy');

        if (!form) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Registration form not found",
          });
        }

        return form;
      } catch (error) {
        console.error("Error getting registration form:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get registration form",
        });
      }
    }),

  // Get form submissions (for admin dashboard)
  getSubmissions: adminProcedure
    .input(z.object({
      formId: z.string(),
    }))
    .query(async ({ input }) => {
      try {
        await connectToDatabase();

        const submissions = await FormSubmission.find({ formId: input.formId })
          .sort({ createdAt: -1 })
          .populate('userId');

        return submissions;
      } catch (error) {
        console.error("Error getting form submissions:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get form submissions",
        });
      }
    }),
});
