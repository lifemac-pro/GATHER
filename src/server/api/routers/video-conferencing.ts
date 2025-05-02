import { z } from "zod";
import { createTRPCRouter, protectedProcedure, adminProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { 
  createVideoConference, 
  getVideoConference, 
  updateVideoConference, 
  deleteVideoConference,
  isVideoConferencingConfigured,
  VideoConferencingPlatform
} from "@/lib/video-conferencing";

// Define the meeting settings schema
const meetingSettingsSchema = z.object({
  hostVideo: z.boolean().optional(),
  participantVideo: z.boolean().optional(),
  joinBeforeHost: z.boolean().optional(),
  muteUponEntry: z.boolean().optional(),
  waitingRoom: z.boolean().optional(),
  recording: z.boolean().optional(),
});

export const videoConferencingRouter = createTRPCRouter({
  // Check if a platform is configured
  isPlatformConfigured: protectedProcedure
    .input(z.object({
      platform: z.enum(["zoom", "google-meet", "teams", "other"]),
    }))
    .query(async ({ input }) => {
      try {
        const isConfigured = isVideoConferencingConfigured(input.platform as VideoConferencingPlatform);
        return { isConfigured };
      } catch (error) {
        console.error("Error checking platform configuration:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to check platform configuration",
        });
      }
    }),
    
  // Create a meeting
  createMeeting: adminProcedure
    .input(z.object({
      platform: z.enum(["zoom", "google-meet", "teams", "other"]),
      topic: z.string().min(1),
      description: z.string().optional(),
      startTime: z.date(),
      duration: z.number().int().min(1),
      timezone: z.string().optional(),
      password: z.string().optional(),
      settings: meetingSettingsSchema.optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const meetingDetails = await createVideoConference(
          input.platform as VideoConferencingPlatform,
          {
            topic: input.topic,
            description: input.description,
            startTime: input.startTime,
            duration: input.duration,
            timezone: input.timezone,
            password: input.password,
            settings: input.settings,
          }
        );
        
        return meetingDetails;
      } catch (error) {
        console.error("Error creating meeting:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create meeting",
        });
      }
    }),
    
  // Get a meeting
  getMeeting: protectedProcedure
    .input(z.object({
      platform: z.enum(["zoom", "google-meet", "teams", "other"]),
      meetingId: z.string(),
    }))
    .query(async ({ input }) => {
      try {
        const meetingDetails = await getVideoConference(
          input.platform as VideoConferencingPlatform,
          input.meetingId
        );
        
        if (!meetingDetails) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Meeting not found",
          });
        }
        
        return meetingDetails;
      } catch (error) {
        console.error("Error getting meeting:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get meeting",
        });
      }
    }),
    
  // Update a meeting
  updateMeeting: adminProcedure
    .input(z.object({
      platform: z.enum(["zoom", "google-meet", "teams", "other"]),
      meetingId: z.string(),
      topic: z.string().min(1).optional(),
      description: z.string().optional(),
      startTime: z.date().optional(),
      duration: z.number().int().min(1).optional(),
      timezone: z.string().optional(),
      password: z.string().optional(),
      settings: meetingSettingsSchema.optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const { platform, meetingId, ...options } = input;
        
        const meetingDetails = await updateVideoConference(
          platform as VideoConferencingPlatform,
          meetingId,
          options
        );
        
        return meetingDetails;
      } catch (error) {
        console.error("Error updating meeting:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update meeting",
        });
      }
    }),
    
  // Delete a meeting
  deleteMeeting: adminProcedure
    .input(z.object({
      platform: z.enum(["zoom", "google-meet", "teams", "other"]),
      meetingId: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        const success = await deleteVideoConference(
          input.platform as VideoConferencingPlatform,
          input.meetingId
        );
        
        return { success };
      } catch (error) {
        console.error("Error deleting meeting:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete meeting",
        });
      }
    }),
});
