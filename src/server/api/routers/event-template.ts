import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { connectToDatabase } from "@/server/db/mongo";
import { nanoid } from "nanoid";
import { EventOps } from "@/server/db/operations/event-ops";

// Define the template schema
const templateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  location: z.string().optional(),
  duration: z.number().min(30, "Duration must be at least 30 minutes"),
  price: z.number().min(0, "Price cannot be negative"),
  maxAttendees: z.number().min(1, "Maximum attendees must be at least 1"),
  image: z.string().optional(),
});

export const eventTemplateRouter = createTRPCRouter({
  // Get all templates for the current user
  getAll: protectedProcedure.query(async ({ ctx }) => {
    try {
      // Get user ID from session
      const userId =
        ctx &&
        ctx.session &&
        typeof ctx.session === "object" &&
        "userId" in ctx.session
          ? ctx.session.userId
          : undefined;
      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      // Connect to database
      const mongoose = await connectToDatabase();
      const db = mongoose.connection.db;

      if (!db) throw new Error("Database connection not established");

      // Get templates for this user
      const templates = await db
        .collection("eventTemplates")
        .find({ createdById: userId })
        .toArray();

      return templates;
    } catch (error) {
      console.error("Error getting templates:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to retrieve templates",
      });
    }
  }),

  // Get a template by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        // Get user ID from session
        const userId =
          ctx &&
          ctx.session &&
          typeof ctx.session === "object" &&
          "userId" in ctx.session
            ? ctx.session.userId
            : undefined;
        if (!userId) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        // Connect to database
        const mongoose = await connectToDatabase();
        const db = mongoose.connection.db;

        if (!db) throw new Error("Database connection not established");

        // Get template
        const template = await db.collection("eventTemplates").findOne({
          id: input.id,
          createdById: userId,
        });

        if (!template) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Template not found",
          });
        }

        return template;
      } catch (error) {
        console.error("Error getting template:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve template",
        });
      }
    }),

  // Create a new template
  create: protectedProcedure
    .input(templateSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        // Get user ID from session
        const userId =
          ctx &&
          ctx.session &&
          typeof ctx.session === "object" &&
          "userId" in ctx.session
            ? ctx.session.userId
            : undefined;
        if (!userId) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        // Connect to database
        const mongoose = await connectToDatabase();
        const db = mongoose.connection.db;

        if (!db) throw new Error("Database connection not established");

        // Create template
        const template = {
          id: nanoid(),
          ...input,
          createdById: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await db.collection("eventTemplates").insertOne(template);

        return template;
      } catch (error) {
        console.error("Error creating template:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create template",
        });
      }
    }),

  // Update a template
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        ...templateSchema.shape,
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Get user ID from session
        const userId =
          ctx &&
          ctx.session &&
          typeof ctx.session === "object" &&
          "userId" in ctx.session
            ? ctx.session.userId
            : undefined;
        if (!userId) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        // Connect to database
        const mongoose = await connectToDatabase();
        const db = mongoose.connection.db;

        if (!db) throw new Error("Database connection not established");

        // Check if template exists and belongs to user
        const existingTemplate = await db.collection("eventTemplates").findOne({
          id: input.id,
          createdById: userId,
        });

        if (!existingTemplate) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Template not found",
          });
        }

        // Update template
        const { id, ...updateData } = input;
        const updatedTemplate = {
          ...updateData,
          updatedAt: new Date(),
        };

        await db
          .collection("eventTemplates")
          .updateOne({ id }, { $set: updatedTemplate });

        return {
          id,
          ...updatedTemplate,
        };
      } catch (error) {
        console.error("Error updating template:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update template",
        });
      }
    }),

  // Delete a template
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        // Get user ID from session
        const userId =
          ctx &&
          ctx.session &&
          typeof ctx.session === "object" &&
          "userId" in ctx.session
            ? ctx.session.userId
            : undefined;
        if (!userId) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        // Connect to database
        const mongoose = await connectToDatabase();
        const db = mongoose.connection.db;

        if (!db) throw new Error("Database connection not established");

        // Check if template exists and belongs to user
        const existingTemplate = await db.collection("eventTemplates").findOne({
          id: input.id,
          createdById: userId,
        });

        if (!existingTemplate) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Template not found",
          });
        }

        // Delete template
        await db.collection("eventTemplates").deleteOne({ id: input.id });

        return { success: true };
      } catch (error) {
        console.error("Error deleting template:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete template",
        });
      }
    }),

  // Create an event from a template
  createEvent: protectedProcedure
    .input(
      z.object({
        templateId: z.string(),
        startDate: z.date(),
        endDate: z.date(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Get user ID from session
        const userId =
          ctx &&
          ctx.session &&
          typeof ctx.session === "object" &&
          "userId" in ctx.session
            ? ctx.session.userId
            : undefined;
        if (!userId) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        // Connect to database
        const mongoose = await connectToDatabase();
        const db = mongoose.connection.db;

        if (!db) throw new Error("Database connection not established");

        // Get template
        const template = await db.collection("eventTemplates").findOne({
          id: input.templateId,
          createdById: userId,
        });

        if (!template) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Template not found",
          });
        }

        // Create event from template
        const event = await EventOps.create({
          name: template.name,
          description: template.description || "",
          location: template.location || "",
          startDate: input.startDate,
          endDate: input.endDate,
          category: template.category,
          featured: false,
          price: template.price || 0,
          image: template.image || "",
          createdById: userId,
          status: "published",
          maxAttendees: template.maxAttendees
            ? [template.maxAttendees.toString()]
            : [],
        });

        if (!event) {
          throw new Error("Failed to create event");
        }

        return event;
      } catch (error) {
        console.error("Error creating event from template:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create event from template",
        });
      }
    }),
});
