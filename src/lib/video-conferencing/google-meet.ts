import { VideoConferencingService, MeetingDetails, CreateMeetingOptions } from "./index";
import { env } from "@/env";
import { google } from "googleapis";

// Check if Google Meet is configured
const isGoogleMeetConfigured = (): boolean => {
  return !!(
    env.GOOGLE_CLIENT_ID &&
    env.GOOGLE_CLIENT_SECRET &&
    env.GOOGLE_REFRESH_TOKEN
  );
};

// Get Google OAuth2 client
const getGoogleAuthClient = async () => {
  if (!isGoogleMeetConfigured()) {
    throw new Error("Google Meet API is not configured");
  }
  
  const oauth2Client = new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET
  );
  
  oauth2Client.setCredentials({
    refresh_token: env.GOOGLE_REFRESH_TOKEN,
  });
  
  return oauth2Client;
};

// Create a Google Meet meeting
const createGoogleMeeting = async (options: CreateMeetingOptions): Promise<MeetingDetails> => {
  try {
    const auth = await getGoogleAuthClient();
    const calendar = google.calendar({ version: "v3", auth });
    
    // Calculate end time
    const startTime = new Date(options.startTime);
    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + options.duration);
    
    // Create event with Google Meet conference
    const event = {
      summary: options.topic,
      description: options.description,
      start: {
        dateTime: startTime.toISOString(),
        timeZone: options.timezone || "UTC",
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: options.timezone || "UTC",
      },
      conferenceData: {
        createRequest: {
          requestId: `meet-${Date.now()}`,
          conferenceSolutionKey: {
            type: "hangoutsMeet",
          },
        },
      },
    };
    
    const response = await calendar.events.insert({
      calendarId: "primary",
      conferenceDataVersion: 1,
      requestBody: event,
    });
    
    if (!response.data || !response.data.conferenceData) {
      throw new Error("Failed to create Google Meet conference");
    }
    
    const meetingUrl = response.data.conferenceData.entryPoints?.find(
      (entry) => entry.entryPointType === "video"
    )?.uri;
    
    if (!meetingUrl) {
      throw new Error("No meeting URL found in Google Meet response");
    }
    
    return {
      platform: "google-meet",
      meetingUrl,
      meetingId: response.data.id || "",
      joinUrl: meetingUrl,
    };
  } catch (error) {
    console.error("Error creating Google Meet meeting:", error);
    throw new Error("Failed to create Google Meet meeting");
  }
};

// Get a Google Meet meeting
const getGoogleMeeting = async (meetingId: string): Promise<MeetingDetails | null> => {
  try {
    const auth = await getGoogleAuthClient();
    const calendar = google.calendar({ version: "v3", auth });
    
    const response = await calendar.events.get({
      calendarId: "primary",
      eventId: meetingId,
    });
    
    if (!response.data || !response.data.conferenceData) {
      return null;
    }
    
    const meetingUrl = response.data.conferenceData.entryPoints?.find(
      (entry) => entry.entryPointType === "video"
    )?.uri;
    
    if (!meetingUrl) {
      return null;
    }
    
    return {
      platform: "google-meet",
      meetingUrl,
      meetingId: response.data.id || "",
      joinUrl: meetingUrl,
    };
  } catch (error) {
    console.error("Error getting Google Meet meeting:", error);
    if ((error as any).code === 404) {
      return null;
    }
    throw new Error("Failed to get Google Meet meeting");
  }
};

// Update a Google Meet meeting
const updateGoogleMeeting = async (
  meetingId: string,
  options: Partial<CreateMeetingOptions>
): Promise<MeetingDetails> => {
  try {
    const auth = await getGoogleAuthClient();
    const calendar = google.calendar({ version: "v3", auth });
    
    // Get the existing event
    const existingEvent = await calendar.events.get({
      calendarId: "primary",
      eventId: meetingId,
    });
    
    if (!existingEvent.data) {
      throw new Error("Meeting not found");
    }
    
    // Prepare update payload
    const updatePayload: any = {
      conferenceData: existingEvent.data.conferenceData,
    };
    
    if (options.topic) updatePayload.summary = options.topic;
    if (options.description) updatePayload.description = options.description;
    
    if (options.startTime) {
      // Calculate end time
      const startTime = new Date(options.startTime);
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + (options.duration || 60));
      
      updatePayload.start = {
        dateTime: startTime.toISOString(),
        timeZone: options.timezone || existingEvent.data.start?.timeZone || "UTC",
      };
      
      updatePayload.end = {
        dateTime: endTime.toISOString(),
        timeZone: options.timezone || existingEvent.data.end?.timeZone || "UTC",
      };
    }
    
    // Update the event
    const response = await calendar.events.update({
      calendarId: "primary",
      eventId: meetingId,
      conferenceDataVersion: 1,
      requestBody: updatePayload,
    });
    
    if (!response.data || !response.data.conferenceData) {
      throw new Error("Failed to update Google Meet conference");
    }
    
    const meetingUrl = response.data.conferenceData.entryPoints?.find(
      (entry) => entry.entryPointType === "video"
    )?.uri;
    
    if (!meetingUrl) {
      throw new Error("No meeting URL found in Google Meet response");
    }
    
    return {
      platform: "google-meet",
      meetingUrl,
      meetingId: response.data.id || "",
      joinUrl: meetingUrl,
    };
  } catch (error) {
    console.error("Error updating Google Meet meeting:", error);
    throw new Error("Failed to update Google Meet meeting");
  }
};

// Delete a Google Meet meeting
const deleteGoogleMeeting = async (meetingId: string): Promise<boolean> => {
  try {
    const auth = await getGoogleAuthClient();
    const calendar = google.calendar({ version: "v3", auth });
    
    await calendar.events.delete({
      calendarId: "primary",
      eventId: meetingId,
    });
    
    return true;
  } catch (error) {
    console.error("Error deleting Google Meet meeting:", error);
    if ((error as any).code === 404) {
      return true; // Meeting doesn't exist, consider it deleted
    }
    throw new Error("Failed to delete Google Meet meeting");
  }
};

// Export the Google Meet service
export const googleMeetService: VideoConferencingService = {
  createMeeting: createGoogleMeeting,
  getMeeting: getGoogleMeeting,
  updateMeeting: updateGoogleMeeting,
  deleteMeeting: deleteGoogleMeeting,
  isConfigured: isGoogleMeetConfigured,
};
