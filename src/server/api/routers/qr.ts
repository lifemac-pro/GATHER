import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { Event, Attendee } from "@/server/db/models";
import { TRPCError } from "@trpc/server";
import QRCode from "qrcode";
import { nanoid } from "nanoid";

export const qrRouter = createTRPCRouter({
  generateEventQR: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const event = await Event.findOne({ id: input.eventId });
      if (!event) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Event not found",
        });
      }

      // Generate a unique check-in code
      const checkInCode = nanoid(10);
      
      // Update event with check-in code
      await Event.updateOne(
        { id: input.eventId },
        { $set: { checkInCode } }
      );

      // Generate QR code
      const qrData = await QRCode.toDataURL(JSON.stringify({
        eventId: input.eventId,
        code: checkInCode,
      }));

      return { qrCode: qrData, checkInCode };
    }),

  verifyCheckIn: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        code: z.string(),
        attendeeId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const event = await Event.findOne({ 
        id: input.eventId,
        checkInCode: input.code,
      });

      if (!event) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid check-in code",
        });
      }

      const attendee = await Attendee.findOneAndUpdate(
        {
          id: input.attendeeId,
          eventId: input.eventId,
          checkedInAt: null,
        },
        {
          $set: {
            checkedInAt: new Date(),
            checkInMethod: "qr",
          },
        },
        { new: true }
      );

      if (!attendee) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Attendee not found or already checked in",
        });
      }

      return attendee;
    }),

  validateTicket: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        ticketCode: z.string(),
      })
    )
    .query(async ({ input }) => {
      const attendee = await Attendee.findOne({
        eventId: input.eventId,
        ticketCode: input.ticketCode,
      }).populate("event", "name startDate");

      if (!attendee) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invalid ticket code",
        });
      }

      return {
        valid: true,
        attendee,
        checkedIn: !!attendee.checkedInAt,
      };
    }),
});
