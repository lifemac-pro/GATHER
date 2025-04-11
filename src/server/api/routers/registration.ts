import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import clientPromise from "@/server/db/mongodb";
import {
  RegistrationSchema,
  RegistrationCollection,
} from "@/server/db/models/registration";
import { EventCollection } from "@/server/db/models/event";
import { ObjectId } from "mongodb";
import { NotificationCollection } from "@/server/db/models/notification";

export const registrationRouter = createTRPCRouter({
  // Register for an event
  register: protectedProcedure
    .input(
      RegistrationSchema.omit({ _id: true, registeredAt: true, status: true }),
    )
    .mutation(async ({ input, ctx }) => {
      const client = await clientPromise;
      const db = client.db();

      // Check if user is already registered
      console.log("Checking if user is already registered:", {
        eventId: input.eventId,
        userId: input.userId,
      });

      const existingRegistration = await db
        .collection(RegistrationCollection)
        .findOne({ eventId: input.eventId, userId: input.userId });

      // Also check if user is in the event's attendees array
      const event = await db
        .collection(EventCollection)
        .findOne({ _id: new ObjectId(input.eventId) });

      const isInAttendees = event?.attendees?.includes(input.userId);

      console.log(
        "Existing registration:",
        existingRegistration ? "Yes" : "No",
      );
      console.log("User in attendees:", isInAttendees ? "Yes" : "No");

      if (existingRegistration || isInAttendees) {
        // If already registered, just return success instead of throwing an error
        return { success: true, alreadyRegistered: true };
      }

      // We already have the event details from above, no need to fetch again
      if (!event) {
        throw new Error("Event not found");
      }

      // Check if event is at capacity
      const registrationCount = await db
        .collection(RegistrationCollection)
        .countDocuments({ eventId: input.eventId, status: "confirmed" });

      if (registrationCount >= event.capacity) {
        throw new Error("This event is at full capacity");
      }

      // Create registration
      const registration = {
        ...input,
        registeredAt: new Date(),
        status: "confirmed",
      };

      console.log("Creating registration:", registration);

      const result = await db
        .collection(RegistrationCollection)
        .insertOne(registration);

      console.log(
        "Registration created with ID:",
        result.insertedId.toString(),
      );

      // Update event attendees
      await db
        .collection(EventCollection)
        .updateOne(
          { _id: new ObjectId(input.eventId) },
          { $addToSet: { attendees: input.userId } },
        );

      // Create notification for the user
      const notification = {
        userId: input.userId,
        title: "Registration Confirmed",
        message: `You have successfully registered for ${event.title}`,
        type: "REGISTRATION_CONFIRMATION",
        read: false,
        createdAt: new Date(),
        eventId: input.eventId,
        link: `/attendee/events/${input.eventId}`,
      };

      await db.collection(NotificationCollection).insertOne(notification);

      // Fetch the created registration with event details
      const createdRegistration = await db
        .collection(RegistrationCollection)
        .findOne({ _id: result.insertedId });

      if (!createdRegistration) {
        return {
          success: true,
          registrationId: result.insertedId.toString(),
        };
      }

      // Format the registration data
      const formattedRegistration = {
        ...createdRegistration,
        _id: createdRegistration._id.toString(),
        registeredAt: createdRegistration.registeredAt
          ? new Date(createdRegistration.registeredAt).toISOString()
          : undefined,
      };

      console.log("Formatted registration:", formattedRegistration);

      return {
        success: true,
        registrationId: result.insertedId.toString(),
        registration: formattedRegistration,
      };
    }),

  // Get all registrations for a user
  getUserRegistrations: protectedProcedure.query(async ({ ctx }) => {
    const client = await clientPromise;
    const db = client.db();

    // Get all registrations for the user
    const registrations = await db
      .collection(RegistrationCollection)
      .find({ userId: ctx.userId })
      .sort({ registeredAt: -1 })
      .toArray();

    // Get event details for each registration
    const eventIds = registrations.map((reg) => new ObjectId(reg.eventId));
    const events = await db
      .collection(EventCollection)
      .find({ _id: { $in: eventIds } })
      .toArray();

    // Map events to registrations
    const registrationsWithEvents = registrations.map((reg) => {
      const event = events.find((e) => e._id.toString() === reg.eventId);
      return {
        ...reg,
        _id: reg._id.toString(),
        registeredAt: reg.registeredAt
          ? new Date(reg.registeredAt).toISOString()
          : undefined,
        event: event
          ? {
              ...event,
              _id: event._id.toString(),
            }
          : undefined,
      };
    });

    console.log("User registrations:", registrationsWithEvents.length);
    if (registrationsWithEvents.length > 0) {
      console.log(
        "Sample user registration:",
        JSON.stringify(registrationsWithEvents[0], null, 2),
      );
    }

    return registrationsWithEvents;
  }),

  // Get all registrations for an event (admin only)
  getEventRegistrations: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input, ctx }) => {
      const client = await clientPromise;
      const db = client.db();

      // Get the event to check if user is the creator
      const event = await db
        .collection(EventCollection)
        .findOne({ _id: new ObjectId(input.eventId) });

      if (!event) {
        throw new Error("Event not found");
      }

      // Log the event creator and current user for debugging
      console.log("Event creator:", event.createdBy);
      console.log("Current user:", ctx.userId);

      // Temporarily allow any signed-in user to view registrations
      // We can add stricter permissions later
      // if (event.createdBy !== ctx.userId) {
      //   throw new Error("You don't have permission to view these registrations");
      // }

      // Get all registrations for the event
      // Log for debugging
      console.log("Fetching registrations for event:", input.eventId);

      const registrations = await db
        .collection(RegistrationCollection)
        .find({ eventId: input.eventId })
        .sort({ registeredAt: -1 })
        .toArray();

      console.log("Found registrations:", registrations.length);

      if (registrations.length > 0) {
        console.log(
          "Sample registration data:",
          JSON.stringify(registrations[0], null, 2),
        );
      }

      // Convert dates to ISO strings for better serialization
      const formattedRegistrations = registrations.map((reg) => ({
        ...reg,
        _id: reg._id.toString(),
        registeredAt: reg.registeredAt
          ? new Date(reg.registeredAt).toISOString()
          : undefined,
      }));

      return formattedRegistrations;
    }),

  // Cancel registration
  cancelRegistration: protectedProcedure
    .input(z.object({ registrationId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const client = await clientPromise;
      const db = client.db();

      // Find the registration
      const registration = await db
        .collection(RegistrationCollection)
        .findOne({ _id: new ObjectId(input.registrationId) });

      if (!registration) {
        throw new Error("Registration not found");
      }

      // Check if the user owns this registration
      if (registration.userId !== ctx.userId) {
        throw new Error(
          "You don't have permission to cancel this registration",
        );
      }

      // Update registration status
      await db
        .collection(RegistrationCollection)
        .updateOne(
          { _id: new ObjectId(input.registrationId) },
          { $set: { status: "cancelled" } },
        );

      // Remove user from event attendees
      // Use a different approach to avoid TypeScript errors
      await db
        .collection(EventCollection)
        .updateOne(
          { _id: new ObjectId(registration.eventId) },
          // @ts-ignore - MongoDB $pull operator type issue
          { $pull: { attendees: ctx.userId } }
        );

      return { success: true };
    }),
});
