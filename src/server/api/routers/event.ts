import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/api/trpc";
import clientPromise from "@/server/db/mongodb";
import { EventSchema, EventCollection } from "@/server/db/models/event";
import { ObjectId } from "mongodb";

export const eventRouter = createTRPCRouter({
  // Get all events (public)
  getAll: publicProcedure.query(async () => {
    const client = await clientPromise;
    const db = client.db();
    const events = await db.collection(EventCollection).find({}).toArray();
    return events;
  }),

  // Get event by ID (public)
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const client = await clientPromise;
      const db = client.db();
      const event = await db
        .collection(EventCollection)
        .findOne({ _id: new ObjectId(input.id) });
      return event;
    }),

  // Create new event (protected)
  create: protectedProcedure
    .input(EventSchema.omit({ _id: true }))
    .mutation(async ({ input, ctx }) => {
      const client = await clientPromise;
      const db = client.db();
      const result = await db.collection(EventCollection).insertOne({
        ...input,
        createdBy: ctx.userId,
      });
      return { ...input, _id: result.insertedId.toString() };
    }),

  // Update event (protected)
  update: protectedProcedure
    .input(EventSchema)
    .mutation(async ({ input, ctx }) => {
      const { _id, ...updateData } = input;
      const client = await clientPromise;
      const db = client.db();
      
      // Check if user owns the event
      const event = await db
        .collection(EventCollection)
        .findOne({ _id: new ObjectId(_id) });
      
      if (!event || event.createdBy !== ctx.userId) {
        throw new Error("You don't have permission to update this event");
      }

      await db
        .collection(EventCollection)
        .updateOne(
          { _id: new ObjectId(_id) },
          { $set: updateData }
        );
      return input;
    }),

  // Delete event (protected)
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const client = await clientPromise;
      const db = client.db();
      
      // Check if user owns the event
      const event = await db
        .collection(EventCollection)
        .findOne({ _id: new ObjectId(input.id) });
      
      if (!event || event.createdBy !== ctx.userId) {
        throw new Error("You don't have permission to delete this event");
      }

      await db
        .collection(EventCollection)
        .deleteOne({ _id: new ObjectId(input.id) });
      return { success: true };
    }),

  // Register for an event (protected)
  register: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const client = await clientPromise;
      const db = client.db();
      
      // Check if user is already registered
      const event = await db
        .collection(EventCollection)
        .findOne({ _id: new ObjectId(input.eventId) });
      
      if (!event) {
        throw new Error("Event not found");
      }

      if (event.attendees.includes(ctx.userId)) {
        throw new Error("You are already registered for this event");
      }

      await db.collection(EventCollection).updateOne(
        { _id: new ObjectId(input.eventId) },
        { $addToSet: { attendees: ctx.userId } }
      );
      return { success: true };
    }),

  // Unregister from an event (protected)
  unregister: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const client = await clientPromise;
      const db = client.db();
      
      // Check if user is registered
      const event = await db
        .collection(EventCollection)
        .findOne({ _id: new ObjectId(input.eventId) });
      
      if (!event) {
        throw new Error("Event not found");
      }

      if (!event.attendees.includes(ctx.userId)) {
        throw new Error("You are not registered for this event");
      }

      await db.collection(EventCollection).updateOne(
        { _id: new ObjectId(input.eventId) },
        { $pull: { attendees: ctx.userId } }
      );
      return { success: true };
    }),

  // Get user's events (protected)
  getUserEvents: protectedProcedure.query(async ({ ctx }) => {
    const client = await clientPromise;
    const db = client.db();
    const events = await db
      .collection(EventCollection)
      .find({ createdBy: ctx.userId })
      .toArray();
    return events;
  }),

  // Get events user is attending (protected)
  getAttendingEvents: protectedProcedure.query(async ({ ctx }) => {
    const client = await clientPromise;
    const db = client.db();
    const events = await db
      .collection(EventCollection)
      .find({ attendees: ctx.userId })
      .toArray();
    return events;
  }),
});
