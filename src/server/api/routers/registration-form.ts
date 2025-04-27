import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/api/trpc";
import { RegistrationForm, Event } from "@/server/db/models";
import { nanoid } from "nanoid";
import { TRPCError } from "@trpc/server";
import { connectToDatabase } from "@/server/db/mongo";

// Define Zod schemas for validation
const fieldSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1, "Field label is required"),
  type: z.enum([
    "text",
    "email",
    "phone",
    "number",
    "date",
    "select",
    "checkbox",
    "radio",
    "textarea",
    "file",
  ]),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(),
  validation: z.string().optional(),
  order: z.number(),
  defaultValue: z.string().optional(),
  isHidden: z.boolean().default(false),
  isSystem: z.boolean().default(false),
  maxLength: z.number().optional(),
  minLength: z.number().optional(),
  maxSize: z.number().optional(),
  allowedFileTypes: z.array(z.string()).optional(),
});

const sectionSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Section title is required"),
  description: z.string().optional(),
  order: z.number(),
  fields: z.array(fieldSchema),
  isCollapsible: z.boolean().default(false),
  isCollapsed: z.boolean().default(false),
});

// Create the router
export const registrationFormRouter = createTRPCRouter({
  // Create a new registration form
  create: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        name: z.string().min(1, "Name is required"),
        description: z.string().optional(),
        sections: z.array(sectionSchema),
        isActive: z.boolean().default(true),
        isDefault: z.boolean().default(false),
        requiresApproval: z.boolean().default(false),
        collectPayment: z.boolean().default(false),
        paymentAmount: z.number().optional(),
        paymentCurrency: z.string().default("USD"),
        paymentDescription: z.string().optional(),
        maxRegistrations: z.number().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
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

      // Verify the user has permission to create a form for this event
      if (event.createdById !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to create a form for this event",
        });
      }

      // Process sections and fields to ensure they have IDs
      const sections = input.sections.map((section, sectionIndex) => ({
        ...section,
        id: section.id ?? nanoid(),
        order: sectionIndex,
        fields: section.fields.map((field, fieldIndex) => ({
          ...field,
          id: field.id ?? nanoid(),
          order: fieldIndex,
        })),
      }));

      // If this is the default form, deactivate other default forms
      if (input.isDefault) {
        await RegistrationForm.updateMany(
          { eventId: input.eventId, isDefault: true },
          { $set: { isDefault: false } },
        );
      }

      // Create registration form
      const registrationForm = await RegistrationForm.create({
        id: nanoid(),
        ...input,
        sections,
        createdById: userId,
      });

      return registrationForm;
    }),

  // Update an existing registration form
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1, "Name is required").optional(),
        description: z.string().optional(),
        sections: z.array(sectionSchema).optional(),
        isActive: z.boolean().optional(),
        isDefault: z.boolean().optional(),
        requiresApproval: z.boolean().optional(),
        collectPayment: z.boolean().optional(),
        paymentAmount: z.number().optional(),
        paymentCurrency: z.string().optional(),
        paymentDescription: z.string().optional(),
        maxRegistrations: z.number().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
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

      // Find the form
      const form = await RegistrationForm.findOne({ id: input.id });
      if (!form) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Registration form not found",
        });
      }

      // Verify the event exists
      const event = await Event.findOne({ id: form.eventId });
      if (!event) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
      }

      // Verify the user has permission to update this form
      if (event.createdById !== userId && form.createdById !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to update this form",
        });
      }

      // Process sections and fields if provided
      const updateData = { ...input } as Record<string, unknown>;
      if (input.sections) {
        updateData.sections = input.sections.map((section, sectionIndex) => ({
          ...section,
          id: section.id ?? nanoid(),
          order: sectionIndex,
          fields: section.fields.map((field, fieldIndex) => ({
            ...field,
            id: field.id ?? nanoid(),
            order: fieldIndex,
          })),
        }));
      }

      // If this is being set as the default form, deactivate other default forms
      if (input.isDefault) {
        await RegistrationForm.updateMany(
          { eventId: form.eventId, isDefault: true, id: { $ne: input.id } },
          { $set: { isDefault: false } },
        );
      }

      // Update the form
      const updatedForm = await RegistrationForm.findOneAndUpdate(
        { id: input.id },
        { $set: updateData },
        { new: true },
      );

      return updatedForm;
    }),

  // Get a registration form by ID
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      // Ensure MongoDB is connected
      await connectToDatabase();

      return await RegistrationForm.findOne({ id: input.id });
    }),

  // Get all registration forms for an event
  getByEvent: publicProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input }) => {
      // Ensure MongoDB is connected
      await connectToDatabase();

      return await RegistrationForm.find({ eventId: input.eventId }).sort({
        createdAt: -1,
      });
    }),

  // Get the active registration form for an event
  getActiveByEvent: publicProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input }) => {
      // Ensure MongoDB is connected
      await connectToDatabase();

      // First try to find the default form
      let form = await RegistrationForm.findOne({
        eventId: input.eventId,
        isDefault: true,
        isActive: true,
      });

      // If no default form, get the most recently created active form
      if (!form) {
        form = await RegistrationForm.findOne({
          eventId: input.eventId,
          isActive: true,
        }).sort({ createdAt: -1 });
      }

      return form;
    }),

  // Delete a registration form
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

      // Find the form
      const form = await RegistrationForm.findOne({ id: input.id });
      if (!form) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Registration form not found",
        });
      }

      // Verify the event exists
      const event = await Event.findOne({ id: form.eventId });
      if (!event) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
      }

      // Verify the user has permission to delete this form
      if (event.createdById !== userId && form.createdById !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to delete this form",
        });
      }

      // Delete the form
      await RegistrationForm.deleteOne({ id: input.id });

      return { success: true };
    }),

  // Clone a registration form
  clone: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        newName: z.string().optional(),
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

      // Find the form to clone
      const sourceForm = await RegistrationForm.findOne({ id: input.id });
      if (!sourceForm) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Registration form not found",
        });
      }

      // Verify the event exists
      const event = await Event.findOne({ id: sourceForm.eventId });
      if (!event) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
      }

      // Verify the user has permission to clone this form
      if (event.createdById !== userId && sourceForm.createdById !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to clone this form",
        });
      }

      // Create a new form based on the source form
      const newForm = {
        ...sourceForm.toObject(),
        id: nanoid(),
        name: input.newName || `${sourceForm.name} (Copy)`,
        isDefault: false, // Never clone as default
        createdById: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Create the cloned form
      const clonedForm = await RegistrationForm.create(newForm);

      return clonedForm;
    }),
});
