import { createTRPCRouter, publicProcedure, protectedProcedure } from "@/server/api/trpc";
import { z } from "zod";
import { Context, TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { Event, Attendee } from "@/server/db/models";

const eventInputSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  location: z.string().optional(),
  startDate: z.date(),
  endDate: z.date(),
  maxAttendees: z.number().optional(),
  category: z.string(),
  price: z.number().default(0),
});

type EventInput = z.infer<typeof eventInputSchema>;

interface EventUpdateInput {
  id: string;
  name?: string;
  description?: string;
  location?: string;
  startDate?: Date;
  endDate?: Date;
  maxAttendees?: number;
  category?: string;
  featured?: boolean;
  status?: "draft" | "published" | "cancelled" | "completed";
  price?: number;
}

export const eventRouter = createTRPCRouter({
  create: protectedProcedure
    .input(eventInputSchema)
    .mutation(async ({ input, ctx }) => {
      const event = await Event.create({
        id: nanoid(),
        ...input,
        createdById: ctx.session?.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: "draft"

      });
      return event.toObject();
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const event = await Event.findOne({ id: input.id });
      if (!event) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return event.toObject();
    }),

  getFeatured: publicProcedure.query(async () => {
    try {
      console.log('Executing getFeatured procedure');
      const events = await Event.find({ featured: true, status: "published" });
      console.log('Found events:', events);
      return events.map(e => e.toObject());
    } catch (error) {
      console.error('Error in getFeatured:', error);
      throw error;
    }
  }),

  getUpcoming: publicProcedure.query(async () => {
    const events = await Event.find({
      status: "published",
      startDate: { $gt: new Date() }
    }).sort({ startDate: 1 });
    return events.map(e => e.toObject());
  }),

  getByUser: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const events = await Event.find({ createdById: input.userId });
      return events.map(e => e.toObject());
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        ...eventInputSchema.shape
      })
    )
    .mutation(async ({ input, ctx }) => {
      const event = await Event.findOne({ id: input.id });
      if (!event) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (event.createdById !== ctx.session?.userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const updatedEvent = await Event.findOneAndUpdate(
        { id: input.id },
        {
          ...input,
          updatedAt: new Date()
        },
        { new: true }
      );

      return updatedEvent?.toObject();
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }: { input: any, ctx: Context }) => {
      const event = await Event.findOne({ id: input.id });
      if (!event) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (event.createdById !== ctx.session?.userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      await Event.deleteOne({ id: input.id });
      await Attendee.deleteMany({ eventId: input.id });
      return { success: true };
    }),

  getCategories: publicProcedure.query(async () => {
    const categories = await Event.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    return categories.map(c => ({ name: c._id, count: c.count }));
  }),
});
